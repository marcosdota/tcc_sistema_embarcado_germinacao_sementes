
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

let results1; // experiment data
let results2; // germinated seeds
let results3; // sensor data

let celGerminadas = 0;

(async () => {
		
    try {
        let response = await axios.get('/resultsdata1');
        results1 = JSON.parse(response.data.message);
        
        let response1 = await axios.get('/resultsdata2');
        results2 = JSON.parse(response1.data.message);
        
        let response2 = await axios.get('/resultsdata3');
        results3 = JSON.parse(response2.data.message);
        
        console.log(results1);
		console.log(results2);
		console.log(results3);
		
		desenha();
		dados();
		
    }
    catch (error) {
		console.log(error);
        //alert(error.response.data.message);
    }
})();

function desenha(){
	
	canvas.height = results2[0]['germinated_seeds'].length*50;
	canvas.width = results2[0]['germinated_seeds'][0].length*50;
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	let germinated_seeds = results2[0]['germinated_seeds'];
	
	var px = 0; py=0;
	for(var i = 0; i < germinated_seeds.length; i++){
		for(var j = 0; j < germinated_seeds[0].length; j++){
			ctx.beginPath();
			ctx.lineWidth = 2;
			
			if(germinated_seeds[i][j]){
				celGerminadas++;
				ctx.fillStyle = "green";
				ctx.strokeStyle = "black";
				ctx.rect(px,py,50,50);
				ctx.fill();
				ctx.stroke();
			}
			else{
				ctx.fillStyle = "white";
				ctx.strokeStyle = "black";
				ctx.rect(px,py,50,50);
				ctx.fill();
				ctx.stroke();
			}
			px+=50;
		}
		px = 0;
		py +=50; 
	}
}

function dados(){
	
	var title = document.getElementById("title");
	title.insertAdjacentHTML('beforeend', `${results1[0]['experiment_id']}`);
	
	var date = new Date(results3[0]['date_acquisition']).toLocaleDateString();
	var hora = results3[0]['time_acquisition'];
	var lux = Number(results3[0]['luminosity']).toFixed(2);
	var temperatura = results3[0]['temperature'];
	
	var limiteSeco = Number(results1[0]['ref_csms'][0]);
	var limiteUmido = Number(results1[0]['ref_csms'][1]);
	
	var solo = Number(results3[0]['soil_moisture']);
	var umidadeSolo = 0;
	
	if(solo<=limiteUmido)
		umidadeSolo = 100;
	else if(solo>=limiteSeco)
		umidadeSolo = 0;
	else
		umidadeSolo = Number(100 - (((solo - limiteUmido)/(limiteSeco - limiteUmido))*100)).toFixed(2);
	
	
	
	var data = document.getElementById("data");
	data.insertAdjacentHTML('beforeend', `<br><br>Sementes germinadas: ${celGerminadas} 
										<br>
										<br> Data: ${date}
										<br> Horário: ${hora} 
										<br>
										<br> Intensidade de Luz: ${lux} Lux
										<br> Umidade do Solo: ${umidadeSolo}%
										<br> Temperatura: ${temperatura}<code>&deg;</code>C
										`);
	
}
