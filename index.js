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

let notificationEnabled = true;
let notificationSilent = false;
let notification;
let notifSelect = document.getElementById("notif-select");

function setNotif(pomoNotif) {
	if (pomoNotif === "disabled") {
		notificationEnabled = false;
	} else if (pomoNotif === "silent") {
		notificationEnabled = true;
		notificationSilent = true;
	} else {
		notificationEnabled = true;
		notificationSilent = false;
	}

	notifSelect.value = pomoNotif;
}

if (localStorage.getItem("pomo-notif")) {
	setNotif(localStorage.getItem("pomo-notif"));
}

notifSelect.addEventListener("change", function () {
	setNotif(this.value);
	localStorage.setItem("pomo-notif", this.value);
});

function notify(title, message) {
	if (!notificationEnabled) return;
	if (!("Notification" in window)) {
		return;
	} else if (Notification.permission === "granted") {
		if (notification) notification.close();
		notification = new Notification(title, {
			body: message,
			icon: "./icons/icon192.png",
			silent: notificationSilent,
		});
	} else if (Notification.permission !== "denied") {
		Notification.requestPermission().then(function (permission) {
			if (permission === "granted") {
				notification = new Notification(title, {
					body: message,
					icon: "./icons/icon192.png",
					silent: notificationSilent,
				});
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
		pauseplaybtn.title = "Start Timer";
		pauseplaybtn.className = "paused";
	} else {
		timerWorker.postMessage({
			type: "start",
			t: roundInfo.t,
			maxDuration: config[roundInfo.current],
		});
		roundInfo.running = true;
		pauseplaybtn.title = "Pause Timer";
		pauseplaybtn.className = "playing";
	}
}

pauseplaybtn.addEventListener("click", pauseplay);

nextbtn.addEventListener("click", () => {
	nextRound();
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
		menubtn.title = "Open Settings";
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
		menubtn.title = "Close Settings";
		isMenuActive = true;
	}
});

document.getElementById("resetround").addEventListener("click", () => {
	if (roundInfo.running) pauseplay();
	roundInfo.t = 0;
	setTime();
});

let root = document.documentElement;

const themes = {
	dark: {
		props: {
			"color-scheme": "dark",
			"--focus": "#d64f4f",
			"--short": "#26baba",
			"--long": "#5fbbe6",
		},
		defaccent: "lavender",
	},
	light: {
		props: {
			"color-scheme": "light",
			"--focus": "#d64f4f",
			"--short": "#26baba",
			"--long": "#5fbbe6",
		},
		defaccent: "grey",
	},
	black: {
		props: {
			"color-scheme": "dark",
			"--focus": "#d64f4f",
			"--short": "#26baba",
			"--long": "#5fbbe6",
		},
		defaccent: "lavender",
	},
	white: {
		props: {
			"color-scheme": "light",
			"--focus": "#d64f4f",
			"--short": "#26baba",
			"--long": "#5fbbe6",
		},
		defaccent: "grey",
	},
};

const accents = {
	dark: {
		red: {
			"--bgcolor": "#252222",
			"--bgcolor2": "#403333",
			"--color": "#ffeeee",
			"--coloraccent": "#ffaaaa",
		},
		violet: {
			"--bgcolor": "#252225",
			"--bgcolor2": "#3a2a3a",
			"--color": "#ffeeff",
			"--coloraccent": "#ee82ee",
		},
		blue: {
			"--bgcolor": "#131320",
			"--bgcolor2": "#1d3752",
			"--color": "#eeeeff",
			"--coloraccent": "#9bb2ff",
		},
		lavender: {
			"--bgcolor": "#222230",
			"--bgcolor2": "#333340",
			"--color": "#eeeeff",
			"--coloraccent": "#b2b2ff",
		},
		green: {
			"--bgcolor": "#1d201d",
			"--bgcolor2": "#143814",
			"--color": "#eeffee",
			"--coloraccent": "#8dd48d",
		},
		teal: {
			"--bgcolor": "#111f1f",
			"--bgcolor2": "#334040",
			"--color": "#eeffff",
			"--coloraccent": "#00aaaa",
		},
		grey: {
			"--bgcolor": "#222222",
			"--bgcolor2": "#444444",
			"--color": "#dddddd",
			"--coloraccent": "#aaaaaa",
		},
	},
	black: {
		red: {
			"--bgcolor2": "#403333",
			"--color": "#ffeeee",
			"--coloraccent": "#ffaaaa",
			"--bgcolor": "#000000",
		},
		violet: {
			"--bgcolor": "#000000",
			"--bgcolor2": "#312131",
			"--color": "#ffeeff",
			"--coloraccent": "#ee82ee",
		},
		blue: {
			"--bgcolor2": "#1d3752",
			"--color": "#eeeeff",
			"--coloraccent": "#9bb2ff",
			"--bgcolor": "#000000",
		},
		lavender: {
			"--bgcolor2": "#333340",
			"--color": "#eeeeff",
			"--coloraccent": "#b2b2ff",
			"--bgcolor": "#000000",
		},
		green: {
			"--bgcolor2": "#143814",
			"--color": "#eeffee",
			"--coloraccent": "#8dd48d",
			"--bgcolor": "#000000",
		},
		teal: {
			"--bgcolor": "#000000",
			"--bgcolor2": "#303f3f",
			"--color": "#eeffff",
			"--coloraccent": "#00aaaa",
		},
		grey: {
			"--bgcolor2": "#444444",
			"--color": "#dddddd",
			"--coloraccent": "#aaaaaa",
			"--bgcolor": "#000000",
		},
	},
	light: {
		red: {
			"--bgcolor": "#fff3f3",
			"--bgcolor2": "#ffd2d2",
			"--color": "#222222",
			"--coloraccent": "#d64f4f",
		},
		violet: {
			"--bgcolor": "#fff3ff",
			"--bgcolor2": "#ffd2ff",
			"--color": "#222222",
			"--coloraccent": "#ee82ee",
		},
		blue: {
			"--bgcolor": "#f3f3ff",
			"--bgcolor2": "#d2d2ff",
			"--color": "#222222",
			"--coloraccent": "#4169e4",
		},
		lavender: {
			"--bgcolor": "#faf1ff",
			"--bgcolor2": "#e2d4ff",
			"--color": "#222222",
			"--coloraccent": "#8b51ff",
		},
		teal: {
			"--bgcolor": "#faffff",
			"--bgcolor2": "#cbebeb",
			"--color": "#222222",
			"--coloraccent": "#008080",
		},
		green: {
			"--bgcolor": "#f3fff3",
			"--bgcolor2": "#cafcc1",
			"--color": "#222222",
			"--coloraccent": "#39743d",
		},
		grey: {
			"--bgcolor": "#ffffff",
			"--bgcolor2": "#dddddd",
			"--color": "#333333",
			"--coloraccent": "#555555",
		},
	},
	white: {
		red: {
			"--bgcolor": "#ffffff",
			"--bgcolor2": "#ffd2d2",
			"--color": "#222222",
			"--coloraccent": "#ee7777",
		},
		violet: {
			"--bgcolor": "#ffffff",
			"--bgcolor2": "#ffd2ff",
			"--color": "#222222",
			"--coloraccent": "#ee82ee",
		},
		blue: {
			"--bgcolor": "#ffffff",
			"--bgcolor2": "#d2d2ff",
			"--color": "#222222",
			"--coloraccent": "#4169e4",
		},
		lavender: {
			"--bgcolor": "#ffffff",
			"--bgcolor2": "#e2d4ff",
			"--color": "#222222",
			"--coloraccent": "#8b51ff",
		},
		teal: {
			"--bgcolor": "#ffffff",
			"--bgcolor2": "#cbebeb",
			"--color": "#222222",
			"--coloraccent": "#008080",
		},
		green: {
			"--bgcolor": "#ffffff",
			"--bgcolor2": "#cafcc1",
			"--color": "#222222",
			"--coloraccent": "#39743d",
		},
		grey: {
			"--bgcolor": "#ffffff",
			"--bgcolor2": "#dddddd",
			"--color": "#333333",
			"--coloraccent": "#555555",
		},
	},
};

let theme = "dark";
let themeAccent = "lavender";

let colorsDiv = document.getElementById("colors");

function setTheme(basetheme = "dark", accent) {
	if (!accent) accent = themes[basetheme].defaccent;
	if (basetheme !== "custom") {
		for (let prop in themes[basetheme].props) {
			root.style.setProperty(prop, themes[basetheme].props[prop]);
		}
		document.getElementById("t-" + theme).removeAttribute("selected");
		addColorButtons(basetheme);
		document
			.getElementById("t-" + basetheme)
			.setAttribute("selected", true);
		setAccent(basetheme, accent);
	}
}

let colorBtns = [];

function addColorButtons(basetheme) {
	colorsDiv.innerHTML = "";
	colorBtns = [];
	for (let accent in accents[basetheme]) {
		let btn = document.createElement("button");
		btn.className = "color";
		btn.style.backgroundColor = accents[basetheme][accent]["--coloraccent"];
		btn.dataset.color = basetheme + "-" + accent;
		btn.addEventListener("click", () => {
			setAccent(basetheme, accent);
		});
		btn.title = accent;
		colorBtns.push(btn);
		colorsDiv.appendChild(btn);
	}
}

let themeMeta = document.getElementById("theme-meta");

function setAccent(basetheme, accent) {
	for (let prop in accents[basetheme][accent]) {
		root.style.setProperty(prop, accents[basetheme][accent][prop]);
	}
	themeMeta.setAttribute("content", accents[basetheme][accent]["--bgcolor"]);
	colorBtns.forEach((btn) => {
		if (btn.dataset.active === "true") {
			btn.dataset.active = "false";
		}
		if (btn.dataset.color === basetheme + "-" + accent) {
			btn.dataset.active = "true";
		}
	});

	localStorage.setItem("pomo-theme", basetheme);
	localStorage.setItem("pomo-theme-accent", accent);
	theme = basetheme;
	themeAccent = accent;
}

document.getElementById("theme-select").addEventListener("change", function () {
	setTheme(this.value);
});

if (localStorage.getItem("pomo-theme")) {
	theme = localStorage.getItem("pomo-theme");
	if (localStorage.getItem("pomo-theme-accent")) {
		themeAccent = localStorage.getItem("pomo-theme-accent");
	}
}
setTheme(theme, themeAccent);

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

let canvas = document.createElement("canvas");
canvas.width = canvas.height = 400;
let ctx = canvas.getContext("2d");

let video = document.createElement("video");
let pipActive = false;

function loop() {
	ctx.fillStyle = accents[theme][themeAccent]["--bgcolor"];
	ctx.fillRect(0, 0, 400, 400);

	ctx.fillStyle = accents[theme][themeAccent]["--color"];
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

	ctx.strokeStyle = accents[theme][themeAccent]["--coloraccent"];
	ctx.lineWidth = 4;
	ctx.beginPath();
	ctx.arc(200, 200, 180, 0, Math.PI * 2);
	ctx.stroke();

	ctx.strokeStyle = themes[theme].props["--" + roundInfo.current];
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

if (document.pictureInPictureEnabled || document.fullscreenEnabled) {
	document.body.appendChild(video);
	document.body.appendChild(canvas);
	canvas.id = "canvas";
	let stream = canvas.captureStream();
	video.srcObject = stream;
	video.autoplay = false;
	video.controls = true;
	video.addEventListener("play", () => {
		if (!roundInfo.running) pauseplay();
	});
	video.addEventListener("pause", () => {
		if (roundInfo.running) pauseplay();
	});
	loop();

	video.onenterpictureinpicture = () => {
		pipActive = true;
		video.classList.add("pipactive");
	};
	video.onleavepictureinpicture = () => {
		if (document.fullscreenElement) return;
		pipActive = false;
		video.classList.remove("pipactive");
	};
	video.onfullscreenchange = (ev) => {
		if (document.fullscreenElement) {
			pipActive = true;
			video.classList.add("pipactive");
		} else {
			pipActive = false;
			video.classList.remove("pipactive");
		}
	};
	document.getElementById("popupbtn").addEventListener("click", () => {
		if (document.pictureInPictureElement) {
			document.exitPictureInPicture();
			video.classList.remove("pipactive");
			return;
		}
		if (pipActive) {
			pipActive = false;
			video.classList.remove("pipactive");
			return;
		}
		loop();
		video.play();
		video.classList.add("pipactive");
		if (document.pictureInPictureEnabled) {
			video.requestPictureInPicture();
		}
		pipActive = true;
	});
} else {
	document.getElementById("popupbtn").style.display = "none";
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
	}
});

if (!localStorage.getItem("pomo-notfirstload")) {
	document.getElementById("firstload").style.display = "block";
	mainel.style.display = "none";
	document.getElementById("closeintro").addEventListener("click", () => {
		document.getElementById("firstload").style.display = "none";
		localStorage.setItem("pomo-notfirstload", "notfirstload");
		mainel.style.display = "flex";
	});
}
