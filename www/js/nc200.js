/* config Object template.
{
	ip:"192.168.1.10", 
	user:"admin", 
	password:"admin",
	ftpNotify: {},
	emailNotify: {}
}
*/

const gGetDefaultPaths = ["getvideosetting",
						 "getvideoctrls",
						 "getosdandtimedisplay",
						 "getreceiver",
						 "getsoundsetting",
						 "getcloudurl",
						 "smtp_and_ftp_load",
						 "mdconfsettinginit",
						 "ledgetting"];

const gGetDefaultPathArgs = {getvideoctrls:{all:"any value"}};

const gSetDefaultPaths = ["setvideoctrls",
						 "mdconf"];

class nc200QueweItem {
	constructor(path,data){
		this._path = path;
		this._data = data;		
	}

	getPath(){
		return this._path;
	}

	getData(){
		return this._data;
	}
}


class nc200device {
	constructor(config, updateCallback){

		if (typeof config == 'object') this._config = config;
		else this._config = {ip:"",user:"",password:""}
		
		this._liveData = {				
		token:"",
		cookie:"",		
		data:{
			videoSettings:"",
			videoCtrls:"",
			osdAndTimeDisplay: "",
			receiver: "",	
			soundSetting: "",
			cloudUrl: "",
			smtpAndFtp: ""}
		}
	
		this._updateCallback = updateCallback;
		this._state = "idle";		
		this._interval = 50;
		var that = this;		
		this._timer = setTimeout(function ()
		{
			that._tasker();
		}, this._interval);			
		
		this._quewe = new Array();		
		this._request = require('ajax-request');
		this._cookie = require('cookie-session');
	}
	
	connect(ip,user,password){				
		this._config.ip = ip;
		this._config.user = user;
		this._config.password = password;
		this._setState("sync");
	}

	reConnect(){				
		this._setState("sync");
	}

	updateRequest(path,data)
	{
		data = this._dataPrepare(path,data);
		var item = new nc200QueweItem(path,data);
		this._quewe.push(item);
	}
	
	_tasker()
	{
		switch(this._state)
		{
			case "idle":
				if(this._quewe.length > 0){
					let item = this._quewe[0];
					this._sendRequest(item.getPath(), item.getData());
					this._setState("ajaxWait");
				}
				break;

			case "sync":					
				//OSLL: Add to quewe all data retrieve paths...
				for(var t in gGetDefaultPaths)
				{
					let path = gGetDefaultPaths[t];
					let append = gGetDefaultPathArgs[path];
					if(append == undefined) append = {};
					let item = new nc200QueweItem(path, append);
					this._quewe.push(item);
				}				
				this._setState("idle");	
				break;	

			case "doLogin":
				this._doLogin();
				this._setState("ajaxWait");			
				break;

			case "ajaxWait"	:
				//OSLL: Will wait here until receive reply or get timeout...
				break;		
				
			case "error":
				this._setState("idle");	
				break;
				
			default:
				break;
			
		}
		var that = this;
		this._timer = setTimeout(function (){that._tasker();}, this._interval);		
	}
	
	_setState(newState)
	{
		this._state = newState;
	}
	
	_ajaxCallback(err, res, body)
	{	
		console.log("_ajaxCallback()", res.req.path, body);	
		if(res !== undefined)
		{			
			switch(res.statusCode)
			{
				case 200:
				this._processReply(res, body);
				break;
				
				case 403:
				this._setState("doLogin");	
				break;
				
				default:
				break;								
			}
		}				
	}
	
	_processReply(res, body)
	{
		var path = res.req.path;
		if(path.indexOf("login") >= 0)
		{
			var obj = JSON.parse(body);
			if(typeof obj == "object")
			{
				if(typeof obj.token == "string")
				{
					this._liveData.token = obj.token;													
					this._liveData.cookie = res.headers['set-cookie'][0];										
					this._updateCallback("login", JSON.stringify(this._config));
					//console.log("_liveData.token updated: " + this._liveData.token);		
					//console.log("_liveData.cookie updated: " + this._liveData.cookie);
					this._setState("sync");
					return;
				}
				else
				{
					console.log("Error: /login.fcgi " + body);
				}
			}
		}
		else {
			for(var item in gGetDefaultPaths){
				let cmp = gGetDefaultPaths[item];
				if(path.indexOf(cmp) >= 0)
				{
					this._updateCallback(cmp, body);										
					this._quewe.shift();
					this._setState("idle");
					return;
				}
			}	
			//OSLL: We are going to process set-replies separately from get requests because
			//		nc200 retourns a non-standard JSON data that should be pre-processed...
			for(var item in gSetDefaultPaths){
				let cmp = gSetDefaultPaths[item];
				if(path.indexOf(cmp) >= 0)
				{
					let sbody = body.split("&&");					
					this._updateCallback(cmp, sbody[0]);										
					this._quewe.shift();
					this._setState("idle");
					return;
				}
			}	
			
			console.log("Error: Unknown path => " + path, body);
			this._quewe.shift();
			this._setState("error");		
		}		
	}

	_dataPrepare(path,data)
	//OSLL: The NC200 interface is not so consistent. Therefore the data update format
	//		must be pre-processed according the nc200 expects...
	{
		let dta = {};
		switch(path)
		{
			case "setvideoctrls":			
			dta.brightness = data.brightness.value;
			dta.contrast = data.contrast.value;
			dta.saturation = data.saturation.value;
			dta.hue = data.hue.value;
			dta.grama = data.grama.value;
            dta.sharpness = data.sharpness.value;
            dta.backlight_compensation = data.backlight_compensation.value;
            dta.powerline_frequency = data.powerline_frequency.value;
			dta.image_quality = data.hue.value;				   
			dta.flip = data.flip.value;
			dta.mirror = data.mirror.value;
			return dta;			
			break;

			case "mdconf":
			dta.is_enable = data.enable.value;
			dta.precision = data.precision.value;
			let t = 1;
			for(let a of data.area) {
				if(a === 1) dta['area' + t] = 1;
				else dta['area' + t] = 0;
				t++;
			}		
			return dta;			
			break;

			default:
			break;
		}

		return data;
	}
	
//-----------------------------------------------------------	

	_doLogin()
	{
		var self = this;	
		var rand = Math.random() + ""; 
		
		this._request({
			url: 'http://' + this._config.ip + '/login.fcgi',
			method: 'POST',		
			data:{
				Username: this._config.user,
				Password: btoa(this._config.password)
			},
			headers: {
				'Connection': 'keep-alive',
				'Cache-Control': 'no-cache',
				'Content-Type': 'application/x-www-form-urlencoded',				 				
				'User-Agent': 'node-nc200-control/1.0',
				'Cookie': 'sess=' + btoa(rand)	
			}	
			}, function (err, res, body) {
			self._ajaxCallback(err, res, body);
			});
	}
	
	_sendRequest(path, data)
	{
		var self = this;
		data.token = this._liveData.token;
							
		this._request({
		url: 'http://' + this._config.ip + '/'+ path +'.fcgi',
		method: 'POST',
		data: data,			
		headers: {
			'Connection': 'keep-alive',
			'Cache-Control': 'no-cache',
			'Content-Type': 'application/x-www-form-urlencoded',				 				
			'User-Agent': 'node-nc200-control/1.0',
			'Cookie': this._liveData.cookie			
		}
		}, function (err, res, body) {
		self._ajaxCallback(err, res, body);
		});

		console.log("_sendRequest()", path, data);
	}		
}

module.exports.nc200device = nc200device;