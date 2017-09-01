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

var cam = new nc200.nc200device(config, function (eventPath, data){		

	switch(eventPath)
	{
		case "login":
			document.getElementById("liveViewInterface_id").update(data);
			//OSLL: Succesfull login saves credentials for next use...
			window.localStorage.setItem("nc200-credentials", data);
			break;

		case "getvideoctrls":
		case "setvideoctrls":
			document.getElementById("videoCtrlsInterface_id").update(data);
			break;


		default:
			//log.info("Unhandled event: " + eventPath + ", data: " + data);
			break;
	}
});

//var live;
//live = document.getElementById('liveViewInterface_id');

var lastTimestamp = 0;
window.addEventListener('WebComponentsReady', function(e) {	
	//OSLL: App behaviour
	document.addEventListener('change', (e) => {
		if(e.timeStamp != lastTimestamp){
		//OSLL: Some events are fired twice!	
			lastTimestamp = e.timeStamp;			
			//console.log(e);
			if(e.target.className.indexOf("layout-control") >= 0)
			{
				let target = e.target.attributes["checktarget"].nodeValue;
				target = document.getElementById(target);
				target.style.display = (e.target.attributes["aria-checked"].nodeValue === "true")?"inline-block":"none";
			}		
		}
		
	});


	//OSLL: NC200 Object Interface
	document.addEventListener('parseError_msg', process_error);
	document.addEventListener('doLogin_msg', process_msg);
	document.addEventListener('updateVideoCtrls_msg', process_msg);

	let data = window.localStorage.getItem("nc200-credentials");
	if(data != null){
	document.getElementById("loginInterface_id").update(data);
	}
				
	console.log('WebComponentsReady');	
});

function process_error(data)
{	
	console.log(data);	
}

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

		default:
			console.log("process_msg->", data.detail);
			break;
	}
	
	
}

