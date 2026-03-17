const jsPsych = initJsPsych();

const timeline = [];

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: '<h1>THIS WORKS OFFLINE</h1>',
  choices: ['OK']
});

jsPsych.run(timeline);