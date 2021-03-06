/**
 * Copyright (c) 2017 NAVER Corp.
 * billboard.js project is licensed under the MIT license
 */
/* global sandbox, window */
import * as d3 from "d3";
import simulant from "simulant";
import {bb} from "../../src/core";

/**
 * Create a DOM element
 * @param {String} idValue id value
 */
const initDom = idValue => {
	const id = idValue && idValue.replace && idValue.replace("#", "");

	if (!document.getElementById(id)) {
		sandbox("chart", {
			style: "width:640px;height:480px;"
		});

		document.body.style.margin = "0px";
	}
};

/**
 * Generate chart
 * @param {Object} args chart options
 * @return {bb} billboard.js instance
 */
const generate = args => {
	let chart;
	let inputType = "mouse";

	if (args) {
		if (!args.bindto) {
			args.bindto = "#chart";
		}

		initDom(args.bindto);

		// when touch param is set, make to be 'touch' input mode
		if (args.interaction && args.interaction.inputType && args.interaction.inputType.touch) {
			inputType = "touch";
		}

		bb.chart.internal.fn.convertInputType = () => inputType;

		window.d3 = d3;
		chart = bb.generate(args);
	}

	return chart;
};

/**
 * Dispatch an event
 * @param {HTMLElement|SVGElement} element DOM element to be dispatched
 * @param {String} name event name
 * @param {Object} options value to be set
 * @param {bb} chart billboard.js instance
 */
const fireEvent = (element, name, options = {}, chart) => {
	const paddingLeft =
		(chart && chart.internal.main.node().transform.baseVal.getItem(0).matrix.e) || 0;

	// adjust clientX/Y value
	"clientX" in options && (options.clientX += paddingLeft);
	"clientY" in options && (options.clientY += 5);

	if (element) {
		d3.event = simulant.fire(element, name, options);

	// for legacy tests compatibility
	} else {
		const event = document.createEvent("MouseEvents");

		event.initMouseEvent(name, true, true, window,
			0, 0, 0, options.clientX, options.clientY,
			false, false, false, false, 0, null);

		d3.event = event;
	}
};

/**
 * Run gesture simulator
 * @param {HTMLElement|SVGElement} el
 * @param {Object} option
 * @param {Function} callback
 */
const simulator = (el, option = {}, callback) => {
	Simulator.gestures.pan(el, Object.assign({
		pos: [50, 50],
		deltaX: -100,
		deltaY: 0,
		duration: 500,
		easing: "linear"
	}, option), callback);
};

/**
 * Parse the d property of an SVG path into an array of drawing commands.
 * @param  {String} d SvgPath d attribute.]
 * @return {Array} an array of drawing commands.
 */
const parseSvgPath = d => {
	const commands = [];
	const commandTokens = ["M","L","I","H","V","C","S","Q","T","A"];
	let command;
	let inX = false;
	let inY = false;
	let x = "";
	let y = "";
	let i = 0;

	for (; i <= d.length; i++) {
		if (commandTokens.indexOf(d[i]) !== -1) {
			if (inX || inY) {
				commands.push({
					command: command,
					x: x,
					y: y
				});

				x = "";
				y = "";
			}

			command = d[i];
			inX = true;
			inY = false;
		} else {
			if (d[i] === ",") {
				if (inY) {
					commands.push({
						command: command,
						x: x,
						y: y
					});

					x = "";
					y = "";
				}

				inX = !inX;
				inY = !inY;
			} else if (inX) {
				x += d[i];
			} else if (inY) {
				y += d[i];
			}
		}
	}

	if (d[i] !== "," && inY) {
		commands.push({
			command: command, x: x, y: y
		});
	}

	return commands;
};

export default {
	fireEvent,
	generate,
	parseSvgPath,
	simulator
};
