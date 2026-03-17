// experiment.js

// Global object to store experiment data across trials
const experimentData = {
  experimenter: '',
  participant: '',
  memory_data: [], // loaded from CSV
  selected_trauma_index: null,
  trauma_likert_responses: [],
  selected_neutral_index: null,
  neutral_likert_responses: [],
  start_time: null,
  end_time: null,
};

const timeline = [];

// Step 1: Experimenter initials input
timeline.push({
  type: 'survey-text',
  questions: [{prompt: "Enter experimenter initials:", name: 'exp_initials', required: true}],
  on_finish: function(data) {
    const response = JSON.parse(data.responses);
    experimentData.experimenter = response.exp_initials.trim();
  }
});

// Step 2: Participant ID input
timeline.push({
  type: 'survey-text',
  questions: [{prompt: "Enter participant ID number:", name: 'participant_id', required: true}],
  on_finish: function(data) {
    const response = JSON.parse(data.responses);
    experimentData.participant = response.participant_id.trim();
  }
});

// Step 3: Load the participant-specific memory CSV
const loadCSV = {
  type: jsPsychCallFunction,
  async: true,
  func: async (done) => {
    const filePath = `memory_files/${experimentData.participant}_memories.csv`;

    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error();
      const text = await response.text();

      const rows = text.trim().split('\n').slice(1); // skip header
      experimentData.memory_data = rows.map(row => {
        const [trauma, neutral] = row.split(',');
        return {
          trauma: trauma.trim(),
          neutral: neutral.trim()
        };
      });
      done();
    } catch (e) {
      alert(`Could not find the file "${filePath}".\nPlease check the filename and try again.`);
      jsPsych.endExperiment("Missing memory file.");
    }
  }
};
      

//Step 5: Research Nurse Instructions 
timeline.push({
  type: 'html-keyboard-response', 
  stimulus: '<p> Press any key and hand laptop to participant </p>'
});

// Step 4: Instruction block (placeholder)
timeline.push({
  type: 'html-keyboard-response',
  stimulus: '<p>Instructions will go here.</p><p>Press any key to continue.</p>'
});

// Step 5: Traumatic memory selection (single choice)
timeline.push({
  type: 'survey-multi-choice',
  questions: [{
    prompt: 'Please select one traumatic memory:',
    name: 'trauma_choice',
    options: experimentData.memory_data.map((m, i) => m.traumatic_memories),
    required: true,
    horizontal: false
  }],
  on_load: function() {
    // Ensure options updated dynamically if needed
  },
  on_finish: function(data) {
    const response = JSON.parse(data.responses);
    experimentData.selected_trauma_index = response.trauma_choice;
  }
});

// Step 6: Start experiment message
timeline.push({
  type: 'html-button-response',
  stimulus: '<p>Press the button below to start the experiment.</p>',
  choices: ['Start']
});

// Step 7: Present selected traumatic memory until button press
timeline.push({
  type: 'html-button-response',
  stimulus: function() {
    const idx = experimentData.selected_trauma_index;
    return `<p>${experimentData.memory_data[idx].traumatic_memories}</p>`;
  },
  choices: ['Continue']
});

// Step 8: Likert scales for traumatic memory (3 separate pages)
for (let i = 1; i <= 3; i++) {
  timeline.push({
    type: 'survey-likert',
    questions: [{
      prompt: `Trauma Likert scale ${i}`,
      labels: ['1', '2', '3', '4', '5'],
      required: true
    }],
    on_finish: function(data) {
      const response = JSON.parse(data.responses);
      experimentData.trauma_likert_responses.push(response.Q0);
    }
  });
}

// Step 9: Neutral memory selection (single choice)
timeline.push({
  type: 'survey-multi-choice',
  questions: [{
    prompt: 'Please select one neutral memory:',
    name: 'neutral_choice',
    options: experimentData.memory_data.map((m, i) => m.neutral_memories),
    required: true,
    horizontal: false
  }],
  on_finish: function(data) {
    const response = JSON.parse(data.responses);
    experimentData.selected_neutral_index = response.neutral_choice;
  }
});

// Step 10: Present selected neutral memory until button press
timeline.push({
  type: 'html-button-response',
  stimulus: function() {
    const idx = experimentData.selected_neutral_index;
    return `<p>${experimentData.memory_data[idx].neutral_memories}</p>`;
  },
  choices: ['Continue']
});

// Step 11: Likert scales for neutral memory (3 separate pages)
for (let i = 1; i <= 3; i++) {
  timeline.push({
    type: 'survey-likert',
    questions: [{
      prompt: `Neutral Likert scale ${i}`,
      labels: ['1', '2', '3', '4', '5'],
      required: true
    }],
    on_finish: function(data) {
      const response = JSON.parse(data.responses);
      experimentData.neutral_likert_responses.push(response.Q0);
    }
  });
}

// Step 12: Final summary and save data
timeline.push({
  type: jsPsychCallFunction,
  func: () => {
    experimentData.start_time = jsPsych.data.get().values()[0].time_start;
    experimentData.end_time = jsPsych.data.get().values().slice(-1)[0].time_finish;

    // Format data object to save
    const output = {
      experimenter_initials: experimentData.experimenter,
      participant_id: experimentData.participant,
      start_time: new Date(experimentData.start_time).toISOString(),
      end_time: new Date(experimentData.end_time).toISOString(),
      trauma_selected: experimentData.selected_trauma_index,
      trauma_likert: experimentData.trauma_likert_responses,
      neutral_selected: experimentData.selected_neutral_index,
      neutral_likert: experimentData.neutral_likert_responses,
    };

    // Save locally as JSON file (could switch to CSV if preferred)
    const blob = new Blob([JSON.stringify(output, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${experimentData.participant}_output.json`;
    a.click();
    URL.revokeObjectURL(url);

    jsPsych.endExperiment('Thank you for participating!');
  }
});

// Initialize jsPsych
jsPsych.init({
  timeline: timeline
});
