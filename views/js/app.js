const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});
let value = params.picture;
document.getElementById("canvas").style.backgroundImage = "url('../img/" + value + "')";

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.strokeStyle = "red";
ctx.lineWidth = 2;

document.getElementById("numCelHoriz").addEventListener("input", function () {
    desenha(0);
});
document.getElementById("numCelVert").addEventListener("input", function () {
    desenha(0);
});
document.getElementById("posX").addEventListener("input", function () {
    desenha(0);
});
document.getElementById("posY").addEventListener("input", function () {
    desenha(0);
});
document.getElementById("comprimentoCel").addEventListener("input", function () {
    desenha(0);
});
document.getElementById("larguraCel").addEventListener("input", function () {
    desenha(0);
});

function desenhaCelulas(e) {
    e.preventDefault();
    desenha(1);
}

function desenha(alarm) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    numCelHoriz = parseInt(document.querySelector("input#numCelHoriz").value);
    numCelVert = parseInt(document.querySelector("input#numCelVert").value);
    posicaoXinicial = parseInt(document.querySelector("input#posX").value);
    posicaoYinicial = parseInt(document.querySelector("input#posY").value);
    posX = posicaoXinicial;
    posY = posicaoYinicial;
    comprimentoX = parseInt(document.querySelector("input#comprimentoCel").value);
    larguraY = parseInt(document.querySelector("input#larguraCel").value);
    if (isNaN(numCelHoriz) || isNaN(numCelVert) || isNaN(posicaoXinicial) || isNaN(posicaoYinicial) || isNaN(comprimentoX) || isNaN(larguraY)) {
        if (alarm) alert("Verifique os valores de entrada!");
        return;
    }
    for (var y = 0; y < numCelVert; y++) {
        for (var x = 0; x < numCelHoriz; x++) {
            ctx.strokeRect(posX, posY, comprimentoX, larguraY);
            posX += comprimentoX;
        }
        posY += larguraY
        posX = posicaoXinicial
    }
}

async function capturaFoto(e) {
    e.preventDefault();
    var btnCapturaFoto = document.getElementById("capturarFoto");
    btnCapturaFoto.disabled = true;
    try {
        let response = await axios.get('/takePicture');
        let text = response.data.message;
        let result = text.slice(0, -1);
        document.getElementById("canvas").style.backgroundImage = "url('../img/" + result + "')";
    }
    catch (error) {
        console.error(error);
    }
    btnCapturaFoto.disabled = false;
}

async function refSCUS(e, id) {
    e.preventDefault();
    var btn0 = document.getElementById("aquisitarValor0");
    var btn1 = document.getElementById("aquisitarValor1");
    btn0.disabled = true;
    btn1.disabled = true;
    try {
        let response = await axios.get('/CSMS');
        console.log(response.data.message);
        if (id == 0)
            document.getElementById("ref_csmsS").value = response.data.message.slice(0, -1);
        else
            document.getElementById("ref_csmsU").value = response.data.message.slice(0, -1);
    }
    catch (error) {
        //console.error(error);
        alert("Erro ao aquisitar valor")
    }
    btn0.disabled = false;
    btn1.disabled = false;
}

function isInt(value) {
    return !isNaN(value) &&
        parseInt(Number(value)) == value &&
        !isNaN(parseInt(value, 10));
}

async function start(e) {
    e.preventDefault();
    var btn = document.getElementById("iniciar");
    btn.disabled = true;

    horizontal_cells = document.querySelector("input#numCelHoriz").value;
    vertical_cells = document.querySelector("input#numCelVert").value;
    cell_position_x = document.querySelector("input#posX").value;
    cell_position_y = document.querySelector("input#posY").value;
    cell_length = document.querySelector("input#comprimentoCel").value;
    cell_width = document.querySelector("input#larguraCel").value;
    ref_csms0 = document.querySelector("input#ref_csmsS").value;
    ref_csms1 = document.querySelector("input#ref_csmsU").value;

    if (!(isInt(horizontal_cells)
        && isInt(vertical_cells)
        && isInt(cell_position_x)
        && isInt(cell_position_y)
        && isInt(cell_length)
        && isInt(cell_width)
        && isInt(ref_csms0)
        && isInt(ref_csms1))) {
        alert("Verifique os valores de entrada!");
        btn.disabled = false;
        return;
    }

    try {
        let response = await axios.post('/start', {
            horizontal_cells: parseInt(horizontal_cells),
            vertical_cells: parseInt(vertical_cells),
            cell_position_x: parseInt(cell_position_x),
            cell_position_y: parseInt(cell_position_y),
            cell_length: parseInt(cell_length),
            cell_width: parseInt(cell_width),
            ref_csms0: parseInt(ref_csms0),
            ref_csms1: parseInt(ref_csms1),
        });
        //console.log(response.data.message);
        window.location.href = "/";
    }
    catch (error) {
        //alert(error.response.data.message);
        alert("Verifique os valores de entrada!");
    }
    btn.disabled = false;
}