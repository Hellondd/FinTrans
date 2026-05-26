import os
import logging
import pandas as pd
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
import sqlalchemy

from app.models.client import Client
from app.models.contact import Contact
from app.models.address import Address
from app.models.document import Document
from app.models.risk_profile import RiskProfile
from app.models.product import Product
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

MAX_BIND_PARAMS = 30000 

def clean_id(val):
    if pd.isna(val) or val is None or str(val).strip() == "":
        return None
    if isinstance(val, str):
        digits = ''.join(filter(str.isdigit, val))
        return int(digits) if digits else None
    if hasattr(val, 'item'):
        return int(val.item())
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return None

def cast_value(val, alchemy_type, col_name=None):
    if pd.isna(val) or val is None or str(val).strip() == "" or str(val).strip().lower() in ("nan", "nat"):
        return None

    if hasattr(val, 'item'):
        val = val.item()

    if col_name == 'is_fraud':
        if isinstance(val, str):
            return val.strip().upper() in ('FRAUD', '1', 'TRUE', 'YES', 'ДА')
        return bool(val)

    if isinstance(alchemy_type, (sqlalchemy.Date, sqlalchemy.DateTime)):
        try:
            ts = pd.to_datetime(val, errors='coerce')
            if pd.isna(ts): return None
            dt_obj = ts.to_pydatetime()
            if type(alchemy_type) is sqlalchemy.Date or type(alchemy_type).__name__ == 'Date':
                return dt_obj.date()
            return dt_obj
        except Exception:
            return None

    if isinstance(alchemy_type, sqlalchemy.String):
        if isinstance(val, float) and val.is_integer():
            return str(int(val))
        return str(val).strip()

    if isinstance(alchemy_type, sqlalchemy.Integer):
        try:
            if isinstance(val, str):
                val = val.replace(' ', '').replace(',', '.')
            return int(float(val))
        except (ValueError, TypeError):
            return None

    if isinstance(alchemy_type, sqlalchemy.Float):
        try:
            if isinstance(val, str):
                val = val.replace(' ', '').replace(',', '.')
            return float(val)
        except (ValueError, TypeError):
            return None

    if isinstance(alchemy_type, sqlalchemy.Boolean):
        if isinstance(val, str):
            return val.strip().lower() in ('true', '1', 'yes', 'y', 'да', 'verified', 'active')
        return bool(val)

    return val

class ExcelImportService:
    @staticmethod
    async def import_all_data(db: AsyncSession, file_path: str = "data/clients.xlsx"):
        if not os.path.exists(file_path):
            logger.error(f"Файл не найден: {file_path}")
            return False

        sheets_config = [
            ('clients', Client, 'client_id'),
            ('contacts', Contact, 'client_id'),
            ('addresses', Address, 'client_id'),
            ('documents', Document, 'client_id'),
            ('risk_profiles', RiskProfile, 'client_id'),
            ('products', Product, 'product_id'),
            ('transactions', Transaction, 'transaction_id')
        ]
        
        rename_mappings = {
            'transactions': {'transaction_date': 'timestamp', 'channel': 'device', 'risk_marker': 'is_fraud'}
        }

        for sheet, model, unique_col in sheets_config:
            logger.info(f"Начат импорт: {sheet}")
            try:
                df = pd.read_excel(file_path, sheet_name=sheet)
            except Exception as e:
                logger.error(f"Ошибка чтения листа {sheet}: {e}")
                continue

            if sheet in rename_mappings:
                df = df.rename(columns=rename_mappings[sheet])

            if sheet == 'documents':
                docs_grouped = {}
                for _, row in df.iterrows():
                    c_id = clean_id(row.get('client_id'))
                    if not c_id: continue
                        
                    if c_id not in docs_grouped:
                        docs_grouped[c_id] = {
                            'client_id': c_id, 'passport_number': None, 'inn': None,
                            'snils': None, 'document_verified': False, 'verification_date': None
                        }
                    
                    doc_type = str(row.get('document_type', ''))
                    doc_num = row.get('document_number_masked')
                    v_status = str(row.get('verification_status', ''))
                    v_date = row.get('verification_date')
                    
                    if 'Паспорт' in doc_type:
                        docs_grouped[c_id]['passport_number'] = doc_num
                        if v_status.upper() == 'VERIFIED': docs_grouped[c_id]['document_verified'] = True
                        if pd.notna(v_date): docs_grouped[c_id]['verification_date'] = v_date
                    elif 'ИНН' in doc_type:
                        docs_grouped[c_id]['inn'] = doc_num
                    elif 'СНИЛС' in doc_type:
                        docs_grouped[c_id]['snils'] = doc_num
                
                df = pd.DataFrame(list(docs_grouped.values()))

            for col in df.columns:
                if col.endswith('_id'): df[col] = df[col].apply(clean_id)

            # ИСПРАВЛЕНИЕ: БЕРЕМ ТОЛЬКО ТЕ КОЛОНКИ, КОТОРЫЕ ФИЗИЧЕСКИ ЕСТЬ В DATAFRAME.
            # Поля вроде "id" будут пропущены, и база сама подставит SEQUENCE / DEFAULT.
            column_types = {c.name: c.type for c in model.__table__.columns if c.name in df.columns}
            valid_columns = list(column_types.keys())
            
            num_columns = len(valid_columns)
            if num_columns == 0:
                logger.warning(f"Не найдено совпадений колонок для {sheet}. Пропуск.")
                continue

            chunk_size = MAX_BIND_PARAMS // num_columns 

            total_rows = len(df)

            for i in range(0, total_rows, chunk_size):
                chunk = df.iloc[i:i + chunk_size]
                records = []
                
                for _, row in chunk.iterrows():
                    record = {col: cast_value(row.get(col), column_types[col], col_name=col) for col in valid_columns}
                    records.append(record)

                if not records:
                    continue

                stmt = insert(model).values(records).on_conflict_do_nothing(index_elements=[unique_col])
                
                try:
                    await db.execute(stmt)
                    await db.commit()
                except Exception as batch_error:
                    await db.rollback()
                    clean_error = str(batch_error).split('\n')[0]
                    logger.warning(f"Сбой батча {i}-{i+len(records)} в {sheet}. Дробление. Причина: {clean_error}")
                    
                    saved_count = 0
                    for record in records:
                        single_stmt = insert(model).values(record).on_conflict_do_nothing(index_elements=[unique_col])
                        try:
                            await db.execute(single_stmt)
                            await db.commit()
                            saved_count += 1
                        except Exception as row_error:
                            await db.rollback()
                            err_msg = str(row_error).split('\n')[0]
                            logger.error(f"[{sheet}] Ошибка на ID {record.get(unique_col)} -> {err_msg}")
                    
                    logger.info(f"Спасенных записей из батча: {saved_count}/{len(records)}.")

            logger.info(f"Импорт {sheet} завершен.")
        return True