if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register("./sw.js");
}

let timerWorker = new Worker("./worker.js");

let mainel = document.getElementById("main");
let timediv = document.getElementById("time");
let timer = document.getElementById("timer");
let roundnoDiv = document.getElementById("roundno");
let pauseplaybtn = document.getElementById("pauseplay");
let progress = document.getElementById("progress");
let nextbtn = document.getElementById("next");
let menu = document.getElementById("menu");
let menubtn = document.getElementById("menubtn");

const fullname = {
	focus: "Focus",
	short: "Short Break",
	long: "Long Break",
};

function setTime() {
	let seconds = config[roundInfo.current] - roundInfo.t;
	if (seconds < 0) {
		nextRound();
		return;
	}
	let timestr =
		Math.floor(seconds / 60)
			.toString()
			.padStart(2, "0") +
		":" +
		(seconds % 60).toString().padStart(2, "0");
	timediv.innerText = timestr;
	document.title = `${timestr} ${fullname[roundInfo.current]} - Tomodoro`;
	progress.style.strokeDashoffset =
		(roundInfo.t / config[roundInfo.current]) * 100;
	if (pipActive) loop();
}

timerWorker.addEventListener("message", (e) => {
	roundInfo.t = e.data.t;
	setTime();
	if (!e.data.running) {
		timer.style.setProperty("--progress", "0");
		nextRound();
	}
});

let isMenuActive = false;

let config = {
	focus: 1500,
	short: 300,
	long: 900,
	longGap: 4,
};

let roundInfo = {
	t: 0,
	focusNum: 1,
	current: "focus",
	running: false,
};

function nextRound() {
	let finished = fullname[roundInfo.current];
	let body = "Begin ";
	if (roundInfo.current === "focus") {
		finished += " Round";
		if (roundInfo.focusNum >= config.longGap) {
			roundInfo.current = "long";
			roundInfo.focusNum = 0;
		} else {
			roundInfo.current = "short";
		}
		body +=
			"a " +
			Math.floor(config[roundInfo.current] / 60) +
			" minute " +
			fullname[roundInfo.current];
	} else {
		roundInfo.current = "focus";
		roundInfo.focusNum++;
		roundnoDiv.innerText = roundInfo.focusNum + "/" + config.longGap;
		body += "focusing for " + Math.floor(config.focus / 60) + " minutes";
	}

	timer.className = "t-" + roundInfo.current;
	roundInfo.t = 0;
	setTime();
	if (roundInfo.running) {
		timerWorker.postMessage({
			type: "start",
			maxDuration: config[roundInfo.current],
		});
	}
	notify(`${finished} Complete`, body);
}

let notification;
function notify(title, message) {
	if (!("Notification" in window)) {
		return;
	} else if (Notification.permission === "granted") {
		if (notification) notification.close();
		notification = new Notification(title, { body: message });
	} else if (Notification.permission !== "denied") {
		Notification.requestPermission().then(function (permission) {
			if (permission === "granted") {
				notification = new Notification(message);
			}
		});
	}
}

function pauseplay() {
	if (roundInfo.current === "none") {
		nextRound();
		pauseplaybtn.className = "playing";
		return;
	}
	if (roundInfo.running) {
		timerWorker.postMessage({ type: "stop" });
		roundInfo.running = false;
		pauseplaybtn.title = "Start Timer"
		pauseplaybtn.className = "paused";
	} else {
		timerWorker.postMessage({
			type: "start",
			t: roundInfo.t,
			maxDuration: config[roundInfo.current],
		});
		roundInfo.running = true;
		pauseplaybtn.title = "Pause Timer"
		pauseplaybtn.className = "playing";
	}
}

pauseplaybtn.addEventListener("click", pauseplay);

nextbtn.addEventListener("click", () => {
	nextRound();
	timer.style.setProperty("--progress", "0");
});

let menuanim;

menubtn.addEventListener("click", () => {
	if (menuanim) menuanim.cancel();
	if (isMenuActive) {
		mainel.style.display = "flex";
		menuanim = menu.animate(
			[
				{ opacity: "1", transform: "translateY(0)" },
				{
					opacity: "0",
					transform: "translateY(50px)",
				},
			],
			{
				duration: 200,
				fill: "forwards",
			}
		);
		menuanim.onfinish = () => {
			menu.style.display = "none";
		};
		menubtn.title = "Open Settings"
		menubtn.classList.remove("cross");
		isMenuActive = false;
	} else {
		menu.style.display = "flex";
		menuanim = menu.animate(
			[
				{
					opacity: "0",
					transform: "translateY(50px)",
				},
				{ opacity: "1", transform: "translateY(0)" },
			],
			{
				duration: 200,
				fill: "forwards",
			}
		);
		menuanim.onfinish = () => (mainel.style.display = "none");
		menubtn.classList.add("cross");
		menubtn.title = "Close Settings"
		isMenuActive = true;
	}
});

document.getElementById("resetround").addEventListener("click", () => {
	if (roundInfo.running) {
		pauseplay();
	}
	roundInfo.t = 0;
	setTime();
});

let root = document.documentElement;

const themes = {
	dark: {
		"--bgcolor": "#222233",
		"--bgcolor2": "#333344",
		"--color": "#ddddff",
		"--coloraccent": "#b2b2ff",
		"color-scheme": "dark",
		"--focus": "#d64f4f",
		"--short": "#26baba",
		"--long": "#5fbbe6",
	},
	light: {
		"--bgcolor": "#ffffff",
		"--bgcolor2": "#efefff",
		"--color": "#222222",
		"--coloraccent": "#4169e4",
		"color-scheme": "light",
		"--focus": "#d64f4f",
		"--short": "#26baba",
		"--long": "#5fbbe6",
	},
};

let theme = "dark";

function setTheme(ntheme) {
	if (ntheme !== "custom") {
		for (prop in themes[ntheme]) {
			root.style.setProperty(prop, themes[ntheme][prop]);
		}
		localStorage.setItem("pomo-theme", ntheme);
		document.getElementById("t-" + theme).removeAttribute("selected");
		theme = ntheme;
		document.getElementById("t-" + ntheme).setAttribute("selected", true);
	}
}

document.getElementById("theme-select").addEventListener("change", function () {
	setTheme(this.value);
});

if (localStorage.getItem("pomo-theme")) {
	theme = localStorage.getItem("pomo-theme");
	setTheme(theme);
}

if (localStorage.getItem("pomo-config")) {
	config = JSON.parse(localStorage.getItem("pomo-config"));
}

function saveConfig() {
	localStorage.setItem("pomo-config", JSON.stringify(config));
	setTime();
}

const timerInputs = {
	focus: document.getElementById("focus-input"),
	short: document.getElementById("short-input"),
	long: document.getElementById("long-input"),
	rounds: document.getElementById("rounds-input"),
};

timerInputs.focus.value = config.focus / 60;
timerInputs.short.value = config.short / 60;
timerInputs.long.value = config.long / 60;
timerInputs.rounds.value = config.longGap;

function timerInput(name, value) {
	if (value > 180) {
		config[name] = 10800;
		timerInputs[name].value = 180;
	} else if (value < 1) {
		config[name] = 60;
		timerInputs[name].value = 1;
	} else {
		config[name] = value * 60;
	}
	saveConfig();
}

function incrementTimer(name) {
	if (config[name] < 10800) {
		config[name] += 60;
		timerInputs[name].value = config[name] / 60;
	}
	saveConfig();
}

function decrementTimer(name) {
	if (config[name] > 60) {
		config[name] -= 60;
		timerInputs[name].value = config[name] / 60;
	}
	saveConfig();
}

timerInputs.focus.addEventListener("input", function () {
	timerInput("focus", this.value);
});
timerInputs.short.addEventListener("input", function () {
	timerInput("short", this.value);
});
timerInputs.long.addEventListener("input", function () {
	timerInput("long", this.value);
});
timerInputs.rounds.addEventListener("input", function () {
	if (this.value > 18) {
		config.longGap = 18;
		timerInputs.rounds.value = 18;
	} else if (this.value < 1) {
		config.longGap = 1;
		timerInputs.rounds.value = 1;
	} else {
		config.longGap = this.value;
	}
	saveConfig();
});

document
	.getElementById("focus-inc")
	.addEventListener("click", () => incrementTimer("focus"));
document
	.getElementById("short-inc")
	.addEventListener("click", () => incrementTimer("short"));
document
	.getElementById("long-inc")
	.addEventListener("click", () => incrementTimer("long"));

document
	.getElementById("focus-dec")
	.addEventListener("click", () => decrementTimer("focus"));
document
	.getElementById("short-dec")
	.addEventListener("click", () => decrementTimer("short"));
document
	.getElementById("long-dec")
	.addEventListener("click", () => decrementTimer("long"));

document.getElementById("rounds-inc").addEventListener("click", () => {
	config.longGap = config.longGap < 18 ? config.longGap + 1 : 18;
	timerInputs.rounds.value = config.longGap;
	roundnoDiv.innerText = roundInfo.focusNum + "/" + config.longGap;
	saveConfig();
});

document.getElementById("rounds-dec").addEventListener("click", () => {
	config.longGap = config.longGap > 1 ? config.longGap - 1 : 1;
	timerInputs.rounds.value = config.longGap;
	roundnoDiv.innerText = roundInfo.focusNum + "/" + config.longGap;
	saveConfig();
});
// Setup
let canvas = document.createElement("canvas");
canvas.width = canvas.height = 400;
let ctx = canvas.getContext("2d");

let video = document.createElement("video");
let pipActive = false;

function loop() {
	ctx.fillStyle = themes[theme]["--bgcolor"];
	ctx.fillRect(0, 0, 400, 400);

	ctx.fillStyle = themes[theme]["--color"];
	ctx.font = "80px monospace";
	ctx.textAlign = "center";
	let seconds = config[roundInfo.current] - roundInfo.t;
	if (seconds < 0) {
		nextRound();
		return;
	}
	let timestr =
		Math.floor(seconds / 60)
			.toString()
			.padStart(2, "0") +
		":" +
		(seconds % 60).toString().padStart(2, "0");
	ctx.fillText(timestr, 200, 200, 280);

	ctx.font = "32px monospace";
	ctx.fillText(fullname[roundInfo.current].toUpperCase(), 200, 260, 280);

	ctx.strokeStyle = themes[theme]["--coloraccent"];
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.arc(200, 200, 180, 0, Math.PI * 2);
	ctx.stroke();

	ctx.strokeStyle = themes[theme]["--" + roundInfo.current];
	ctx.lineWidth = 16;
	ctx.beginPath();
	ctx.arc(
		200,
		200,
		180,
		-Math.PI / 2,
		(1 - roundInfo.t / config[roundInfo.current]) * Math.PI * 2 -
			Math.PI / 2
	);
	ctx.stroke();
}

function setup() {
	if ("Notification" in window) {
		if (
			Notification.permission !== "denied" &&
			Notification.permission !== "granted"
		) {
			Notification.requestPermission();
		}
	}

	setTime();
	roundnoDiv.innerText = roundInfo.focusNum + "/" + config.longGap;
}

setup();
video.controls = true
video.addEventListener("play", () => {
	if(!roundInfo.running) pauseplay()
})
video.addEventListener("pause", () => {
	if(roundInfo.running) pauseplay()
})
if (document.pictureInPictureEnabled) {
	let stream;
	document.body.appendChild(video);
	document.body.appendChild(canvas);
	canvas.id = "canvas";
	stream = canvas.captureStream();
	video.srcObject = stream;
	video.autoplay = false;
	loop();

	video.onenterpictureinpicture = () => {
		pipActive = true;
	};
	video.onleavepictureinpicture = () => {
		pipActive = false;
	};
	document.getElementById("popupbtn").addEventListener("click", () => {
		if (document.pictureInPictureElement) {
			document.exitPictureInPicture();
			return;
		}
		loop();
		video.play();
		video.requestPictureInPicture();
	});
} else if (document.fullscreenEnabled) {
	let stream;
	document.body.appendChild(video);
	document.body.appendChild(canvas);
	canvas.id = "canvas";
	stream = canvas.captureStream();
	video.srcObject = stream;
	video.autoplay = true;
	video.controls = true;
	loop();

	video.onfullscreenchange = () => {
		if (document.fullscreenElement) {
			pipActive = true;
		} else {
			video.style.display = "none"
			pipActive = false;
		}
	};
	video.onenterpictureinpicture = () => {
		pipActive = true;
	};
	video.onleavepictureinpicture = () => {
		pipActive = false;
	};
	document.getElementById("popupbtn").addEventListener("click", () => {
		if (document.pictureInPictureElement) {
			document.exitPictureInPicture();
			return;
		}
		loop();
		video.play();
		video.style.display = "block";
		video.requestFullscreen();
	});
}

document.addEventListener("keydown", (event) => {
	if (event.isComposing || event.keyCode === 229) {
		return;
	}
	if (event.code === "Space") {
		if (document.activeElement === pauseplaybtn) {
			return;
		}
		pauseplaybtn.focus();
		pauseplay();
		console.log("yo");
	}
});


if (!localStorage.getItem("pomo-notfirstload")) {
	document.getElementById("firstload").style.display = "block"
	mainel.style.display = "none"
	document.getElementById("closeintro").addEventListener("click", () => {
		document.getElementById("firstload").style.display = "none"
		localStorage.setItem("pomo-notfirstload", "notfirstload")
		mainel.style.display = "flex"
	})
}