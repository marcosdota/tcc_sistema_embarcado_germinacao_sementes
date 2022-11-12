import psycopg2
from configDB import configDB as config

def insert_sensor_data(experiment_id, temperature, air_humidity, soil_moisture, luminosity, germinated_seeds):
    sql = """INSERT INTO sensor_data (experiment_id, air_humidity, temperature, soil_moisture, luminosity, germinated_seeds)
             VALUES(%s, %s, %s, %s, %s, %s);"""
    conn = None
    try:
        # read database configuration
        params = config()
        # connect to the PostgreSQL database
        conn = psycopg2.connect(**params)
        # create a new cursor
        cur = conn.cursor()
        # execute the INSERT statement
        cur.execute(sql, (experiment_id, air_humidity, temperature,
                    soil_moisture, luminosity, germinated_seeds))
        # get the row count
        rowcount = cur.rowcount
        print(rowcount)
        # commit the changes to the database
        conn.commit()
        # close communication with the database
        cur.close()

    except (Exception, psycopg2.DatabaseError) as error:
        raise error
    finally:
        if conn is not None:
            conn.close()
            
def insert_germinated_seeds(experiment_id, germinated_seeds):
    sql = """INSERT INTO sensor_data (experiment_id, germinated_seeds)
             VALUES(%s, %s) RETURNING id_data;"""
    conn = None
    try:
        # read database configuration
        params = config()
        # connect to the PostgreSQL database
        conn = psycopg2.connect(**params)
        # create a new cursor
        cur = conn.cursor()
        # execute the INSERT statement
        cur.execute(sql, (experiment_id, germinated_seeds))
        # get the generated id_data back
        id_data = cur.fetchone()[0]
        # commit the changes to the database
        conn.commit()
        # close communication with the database
        cur.close()

    except (Exception, psycopg2.DatabaseError) as error:
        raise error
    finally:
        if conn is not None:
            conn.close()
    return id_data