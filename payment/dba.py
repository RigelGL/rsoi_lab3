import psycopg2
from psycopg2 import pool


class Dba:
    def __init__(self, name, host, user, password):
        try:
            self.pool = psycopg2.pool.SimpleConnectionPool(1, 10, dbname=name, user=user, password=password, host=host)
            print('Connected to PostgreSQL ' + host + '/' + name + ', as ' + user)
        except Exception as e:
            self.pool = None
            print('Can`t establish connection to database')
            print(e)

    def init_database(self):
        f = open('res/init.sql', 'r', encoding='utf-8')
        sql = f.read()
        f.close()
        conn = self.pool.getconn()
        c = conn.cursor()
        c.execute(sql)
        conn.commit()
        c.close()
        self.pool.putconn(conn)
        print('Database updated')

    def add_payment(self, price):
        conn = self.pool.getconn()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO payment (payment_uid, status, price) '
            'VALUES (gen_random_uuid(), %s, %s) RETURNING payment_uid', ('PAID', price))
        uid = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        self.pool.putconn(conn)
        return uid

    def get_payment(self, payment_uid):
        cursor = None
        conn = None
        data = None
        try:
            conn = self.pool.getconn()
            cursor = conn.cursor()
            cursor.execute(
                'SELECT payment_uid, status, price FROM payment WHERE payment_uid=%s',
                (payment_uid,))
            e = cursor.fetchone()
            if e is not None:
                data = {'uid': e[0], 'status': e[1], 'price': e[2]}
        except:
            if conn is not None:
                conn.rollback()
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                self.pool.putconn(conn)
        return data

    def get_payments(self, uids):
        cursor = None
        conn = None
        payments = []
        try:
            conn = self.pool.getconn()
            cursor = conn.cursor()
            sql = 'SELECT payment_uid, status, price FROM payment'
            arr = []
            if uids is not None:
                sql += ' WHERE payment_uid::text = ANY(%s)'
                arr.append(uids)

            cursor.execute(sql, arr)
            for e in cursor.fetchall():
                payments.append({'uid': e[0], 'status': e[1], 'price': e[2]})
        except Exception as e:
            if conn is not None:
                conn.rollback()
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                self.pool.putconn(conn)
        return payments

    def cancel_payment(self, payment_uid):
        cursor = None
        conn = None
        try:
            conn = self.pool.getconn()
            cursor = conn.cursor()
            cursor.execute('UPDATE payment SET status = %s WHERE payment_uid=%s', ('CANCELED', payment_uid))
            conn.commit()
        except:
            if conn is not None:
                conn.rollback()
        finally:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                self.pool.putconn(conn)
