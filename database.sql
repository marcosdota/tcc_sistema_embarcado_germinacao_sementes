CREATE SEQUENCE seq_id_experiment
	MINVALUE 1
	MAXVALUE 9223372036854775807
	INCREMENT 1
	START 1
	CACHE 1;

CREATE TABLE experiments
(
	experiment_id BIGINT NOT NULL DEFAULT NEXTVAL ('seq_id_experiment') PRIMARY KEY,
	horizontal_cells INTEGER NOT NULL,
    vertical_cells INTEGER NOT NULL,
	cell_position_xy INTEGER ARRAY[2] NOT NULL,
    cell_length INTEGER NOT NULL,
    cell_width INTEGER NOT NULL,
	ref_csms INTEGER ARRAY[2] NOT NULL
);


CREATE SEQUENCE seq_id_data
	MINVALUE 1
	MAXVALUE 9223372036854775807
	INCREMENT 1
	START 1
	CACHE 1;
	
CREATE TABLE sensor_data
(
	id_data BIGINT NOT NULL DEFAULT NEXTVAL ('seq_id_data') PRIMARY KEY,
	experiment_id BIGINT NOT NULL,
	date_acquisition DATE NOT NULL DEFAULT current_date,
	time_acquisition TIME NOT NULL DEFAULT current_time,
	air_humidity FLOAT,
	temperature FLOAT,
	soil_moisture FLOAT,
	luminosity FLOAT,
	germinated_seeds BOOLEAN ARRAY,
	CONSTRAINT fk_experiment_id FOREIGN KEY(experiment_id) REFERENCES experiments(experiment_id)
);