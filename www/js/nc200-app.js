const nc200 = require("./js/nc200.js");
const log = require('simple-node-logger').createSimpleLogger('nc200.data.log');
log.setLevel('all');
var config = {
	ip:"192.168.1.10", 
	user:"admin", 
	password:"admin",	
	ftpNotify: {},
	emailNotify: {}
};

let gProgressBarCnt = 0;
let gUiControl = [];
let cam = new nc200.nc200device(config, function (eventPath, data){		

	let bar = document.getElementById("progressBar_id");
	gProgressBarCnt++;

	switch(eventPath)
	{
		case "login":
			document.getElementById("motionSensorInterface_id").update(data);
			//document.getElementById("liveViewInterface_id").update(data);
			//OSLL: Succesfull login saves credentials for next use...
			window.localStorage.setItem("nc200-credentials", data);
			break;
		
		case "mdconfsettinginit":			
			document.getElementById("motionSensorInterface_id").update(data);
			//document.getElementById("liveViewInterface_id").update(data);
			break;

		case "getvideoctrls":
		case "setvideoctrls":
			document.getElementById("videoCtrlsInterface_id").update(data);
			break;

		case "syncData":
			//OSLL: Here use the syncData to setup the top progress bar
			let dta;
			try {
				dta = JSON.parse(data);		
			} catch (e) {
				console.log(e);
			}						
			bar.value = 0;
			bar.min = 0;
			bar.max = dta.length;
			bar.disabled = false;			
			bar.indeterminate = true;		
			gProgressBarCnt = 0;
			break;

		case "ajaxError":
			let err;
			try {
				err = JSON.parse(data);
				bar.disabled = true;			
				bar.value = 0;
				gProgressBarCnt = 0;
				alert("Failed to get data from: " + err.address + "\r\nError: " + err.code);
			} catch (e) {
				console.log(e);
			}
			break;	

		default:
			//log.info("nc200-app, unhandled event: " + eventPath + ", data: " + data);
			break;
	}

	if(gProgressBarCnt >= bar.max) {
		bar.disabled = true;
		bar.value = 0;
	}
	else {
		bar.value += 1;
		bar.indeterminate = false;				
	}

});

var lastTimestamp = 0;
window.addEventListener('WebComponentsReady', function(e) {	
	//OSLL: App behaviour
	document.addEventListener('change', (e) => {
		if(e.timeStamp != lastTimestamp){
			//OSLL: Some events are fired twice!	
			lastTimestamp = e.timeStamp;						
			if(e.target.className.indexOf("layout-control") >= 0)
			{
				let target = e.target.attributes["checktarget"].nodeValue;
				target = document.getElementById(target);
				target.style.display = (e.target.attributes["aria-checked"].nodeValue === "true")?"inline-block":"none";
				saveUserInterfaceState();
			}		
		}
		
	});

	//OSLL: NC200 Object Interface
	document.addEventListener('parseError_msg', process_error);
	document.addEventListener('doLogin_msg', process_msg);
	document.addEventListener('updateVideoCtrls_msg', process_msg);
	document.addEventListener('updateMdConf_msg', process_msg);	

	let data = window.localStorage.getItem("nc200-control");
	if(data != null) {
		gUiControl = JSON.parse(data);		
		loadUserInterfaceState();
	}	
	else {
		saveUserInterfaceState();		
	}

	data = window.localStorage.getItem("nc200-credentials");
	if(data != null){
		document.getElementById("loginInterface_id").update(data);
	}			
});

function process_msg(data)
{
	switch(data.type)
	{	
		case "doLogin_msg":
			cam.connect(data.detail.ip, data.detail.user, data.detail.password);
			break;

		case "updateVideoCtrls_msg":
			cam.updateRequest("setvideoctrls",data.detail);
			break;

		case "updateMdConf_msg":	
			//OSLL: This command does not retourn with current data update so we add manual request after the update...
			cam.updateRequest("mdconf",data.detail);			
			cam.updateRequest("mdconfsettinginit",{});			
			break;

		default:
			console.log("process_msg->", data.detail);
			break;
	}	
}

function process_error(data)
{	
	console.log(data);	
}

function loadUserInterfaceState()
{
	let control = document.querySelectorAll("paper-checkbox.layout-control");
	let t = 0;
	for(let c of control)
	{
		c.attributes["aria-checked"].nodeValue = gUiControl[t];
		t++;
	}
}

function saveUserInterfaceState()
{
	let control = document.querySelectorAll("paper-checkbox.layout-control");
	let t = 0;
	for(let c of control)
	{
		gUiControl[t] = c.attributes["aria-checked"].nodeValue;
		t++;
	}		
	window.localStorage.setItem("nc200-control",JSON.stringify(gUiControl));
}
