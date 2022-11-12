const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();
const url = process.env.PG_URL;

app.use(cors({ origin: `http://localhost:${process.env.HTTP_PORT}` }));
app.use(express.static(path.resolve(__dirname, 'views')));
app.use(express.static(path.resolve(__dirname, 'data')));
app.use(express.json());

let linkPicture = "";
let python;
let pythonPicture;
let pythonCSMS;
let isRunning = false;
let isTakingPhoto = false;
let isAcquiringCSMS = false;

//****************** POSTGRESQL ******************
async function connect() {
    if (global.connection)
        return global.connection.connect();
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: url,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    global.connection = pool;
    return pool.connect();
}

//****************** HELPERS ******************
// get list of imgs in views/img
const directoryPath = path.join(__dirname, 'views', 'img');
function readdirSortTime(dir, timeKey = 'mtime') {
    return (
        fs.readdirSync(dir)
            .map(name => ({
                name,
                time: fs.statSync(`${dir}/${name}`)[timeKey].getTime()
            }))
            .sort((a, b) => (b.time - a.time))
            .map(f => f.name)
    );
}

files = readdirSortTime(directoryPath);
if (files.length > 0)
    linkPicture = files[0];
files = [];
console.log(linkPicture);
console.log(files);

function isInt(value) {
    return !isNaN(value) && 
           parseInt(Number(value)) == value && 
           !isNaN(parseInt(value, 10));
  }

//****************** ROUTES ******************
app.get('/', (req, res) => {
    if (isRunning){
        res.redirect('/results.html',);
	}    
    else{
        let string = encodeURIComponent(linkPicture);
        res.redirect('/app.html?picture=' + string);
    }
});

app.post('/start', async (req, res) => {
    if (isRunning)
        return res.status(400).json({ message: 'experiment running' });

    let { horizontal_cells, vertical_cells, cell_position_x, cell_position_y, cell_length, cell_width, ref_csms0, ref_csms1 } = req.body;

    if (!(isInt(horizontal_cells)
        && isInt(vertical_cells)
        && isInt(cell_position_x)
        && isInt(cell_position_y)
        && isInt(cell_length)
        && isInt(cell_width)
        && isInt(ref_csms0)
        && isInt(ref_csms1)
    ))
        return res.status(400).json({ message: 'error data type' });

    try {
        let client = await connect();
        const sql = 'INSERT INTO experiments(experiment_id, horizontal_cells, vertical_cells, cell_position_xy, cell_length, cell_width, ref_csms) VALUES (DEFAULT,$1,$2,$3,$4,$5,$6) RETURNING experiment_id;';
        const values = [horizontal_cells, vertical_cells, [cell_position_x, cell_position_y], cell_length, cell_width, [ref_csms0, ref_csms1]];
        let result = await client.query(sql, values);
        client.release();
        if (result.rowCount > 0) {
            console.log("app.py starting");
            isRunning = true;
            //sys.argv[1] => result.rows[0]['experiment_id']
            python = spawn('python', [path.resolve(__dirname, "python", "app.py"), result.rows[0]['experiment_id'], horizontal_cells, vertical_cells, cell_position_x, cell_position_y, cell_length, cell_width, ref_csms0, ref_csms1]);
            //python = spawn('python', [command]);
        }
        else
            return res.status(400).json({ message: 'error' });
    }
    catch (err) {
        console.log(err);
        return res.status(400).json({ message: 'error' });
    }
    return res.status(200).json({ message: 'starting' });
});

app.get('/finish', (req, res) => {
    if (isRunning) {
        isRunning = false;
        io.emit('disconnectApp', 0);
        console.log("app.py closed");

        python.stdout.on('data', function (data) {
            //console.log('Pipe data from python script ...');
            dataToSend = data.toString();
            //console.log(data.toString());
        });
        python.on('close', (code) => {
            //console.log(`child process close all stdio with code ${code}`);
            // send data to browser
            //res.send(dataToSend)
            console.log(dataToSend);
        });

    }
    res.redirect('/app.html');
});

app.get('/takePicture', (req, res) => {
    if (isRunning)
        res.redirect('/');
    if (isTakingPhoto)
        return res.status(400).json({ message: 'error capturing photo' });
    isTakingPhoto = true;
    pythonPicture = spawn('python', [path.resolve(__dirname, "python", "takePicture.py")]);
    dataToSend = '';
    pythonPicture.stdout.on('data', function (data) {
        if (data)
            dataToSend = data.toString();
    });

    pythonPicture.on('close', (code) => {
        isTakingPhoto = false;
        linkPicture = dataToSend.slice(0, -1);
        console.log(dataToSend);
        console.log(code);
        if (code == 0)
            return res.status(200).json({ message: dataToSend });
        else
            return res.status(400).json({ message: 'error capturing photo' });
    });
});

app.get('/CSMS', (req, res) => {
    if (isRunning)
        res.redirect('/');
    if (isAcquiringCSMS)
        return res.status(400).json({ message: 'error acquiring data' });
    isAcquiringCSMS = true;
    pythonCSMS = spawn('python', [path.resolve(__dirname, "python", "CSMS.py")]);
    dataToSend = '';
    pythonCSMS.stdout.on('data', function (data) {
        if (data)
            dataToSend = data.toString();
    });

    pythonCSMS.on('close', (code) => {
        isAcquiringCSMS = false;
        //linkPicture = dataToSend.slice(0, -1);
        console.log(dataToSend);
        console.log(code);
        if (code == 0)
            return res.status(200).json({ message: dataToSend });
        else
            return res.status(400).json({ message: 'error acquiring data' });
    });
});

app.get('/resultsdata1', async (req, res) => {
    
    let data;
    
    try {
        
        let client = await connect();
        const sql = "SELECT * FROM experiments ORDER BY experiment_id DESC LIMIT 1";
        
        let result = await client.query(sql);
        client.release();
        
        if (result.rowCount > 0)
            data = JSON.stringify(result['rows']);
        else
            return res.status(400).json({ message: 'error' });
    }
    catch (err) {
        console.log(err);
        return res.status(400).json({ message: 'error' });
    }
    
    return res.status(200).json({ message: data });
   
});

app.get('/resultsdata2', async (req, res) => {
    
    let data;
    
    try {
        
        let client = await connect();
        const sql = "SELECT id_data,experiment_id,germinated_seeds FROM sensor_data WHERE germinated_seeds != '{}' ORDER BY id_data DESC LIMIT 1;";
        
        let result = await client.query(sql);
        client.release();
        
        if (result.rowCount > 0)
            data = JSON.stringify(result['rows']);
        else
            return res.status(400).json({ message: 'error' });
    }
    catch (err) {
        console.log(err);
        return res.status(400).json({ message: 'error' });
    }
    
    return res.status(200).json({ message: data });
   
});

app.get('/resultsdata3', async (req, res) => {
    
    let data;
    
    try {
        
        let client = await connect();
        const sql = "SELECT * FROM sensor_data WHERE germinated_seeds = '{}' ORDER BY id_data DESC LIMIT 1;";
        
        let result = await client.query(sql);
        client.release();
        
        if (result.rowCount > 0)
            data = JSON.stringify(result['rows']);
        else
            return res.status(400).json({ message: 'error' });
    }
    catch (err) {
        console.log(err);
        return res.status(400).json({ message: 'error' });
    }
    
    return res.status(200).json({ message: data });
   
});

//****************** SOCKET ******************
// web socket connection event
io.on('connection', function (socket) {
    console.log("app.py connected");
});

//****************** HTTP ******************
http.listen(process.env.HTTP_PORT || 3000, '0.0.0.0', () => {
    console.log(`server: http://localhost:${process.env.HTTP_PORT}`);
});
