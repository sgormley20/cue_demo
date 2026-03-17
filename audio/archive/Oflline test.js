const jsPsych = initJsPsych({
  on_finish: () => {
    jsPsych.data.displayData();
  }
});

const timeline = [];

timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: 'This works offline!',
  choices: ['OK']
});

jsPsych.run(timeline);