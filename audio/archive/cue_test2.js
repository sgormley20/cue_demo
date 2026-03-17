<!DOCTYPE html>
<html>
  <head>
    <title>Randomisation Experiment</title>

    <!-- jsPsych core and plugins -->
    <script src="https://unpkg.com/jspsych@8.2.1"></script>
    <script src="https://unpkg.com/@jspsych/plugin-html-keyboard-response@2.1.0"></script>
    <script src="https://unpkg.com/@jspsych/plugin-survey-html-form@2.1.0"></script>
    <link href="https://unpkg.com/jspsych@8.2.1/css/jspsych.css" rel="stylesheet" type="text/css" />

    <!-- PapaParse for CSV reading -->
    <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  </head>
  <body></body>

  <script>
    const jsPsych = initJsPsych();

    const csv_url = "https://raw.githubusercontent.com/sgormley20/cue_example/main/Randomisation.csv";

    // Store participant info globally
    let participantID = '';
    let selectedMemory = '';

    const get_id = {
      type: jsPsychSurveyHtmlForm,
      preamble: '<p>Please enter your ID number:</p>',
      html: '<p><input name="participantID" type="text" required></p>',
      on_finish: function(data) {
        participantID = data.response.participantID.trim();
      }
    };

    const memory_selection_screen = {
      type: jsPsychSurveyHtmlForm,
      preamble: `
        <p>In visit 1 you identified 5 trauma memories:</p>
        <p>1. Memory 1<br>
           2. Memory 2<br>
           3. Memory 3<br>
           4. Memory 4<br>
           5. Memory 5</p>
        <p>Please select which memory you would like to focus on today (enter 1–5):</p>`,
      html: '<p><input name="memoryChoice" type="number" min="1" max="5" required></p>',
      on_finish: function(data) {
        selectedMemory = data.response.memoryChoice.trim();
      }
    };

    const load_randomisation = {
      type: jsPsychHtmlKeyboardResponse,
      stimulus: 'Loading randomisation data...',
      trial_duration: 10, // short placeholder while data is loaded
      on_start: function(trial) {
        Papa.parse(csv_url, {
          download: true,
          header: true,
          complete: function(results) {
            const matchedRow = results.data.find(row => row.ID.trim() === participantID);
            let randomisationStimulus;

            if (!matchedRow) {
              randomisationStimulus = "ID not found in the CSV. Please refresh and try again.";
            } else {
              const condition = matchedRow.Randomisation.trim().toUpperCase();
              if (condition === "A") {
                randomisationStimulus = "Randomisation Procedure 1";
              } else if (condition === "B") {
                randomisationStimulus = "Randomisation Procedure 2";
              } else if (condition === "C") {
                randomisationStimulus = "Randomisation Procedure 3";
              } else {
                randomisationStimulus = "Randomisation value not recognized. Please check CSV.";
              }
            }

            // Run rest of timeline dynamically after parsing
            const randomisation_trial = {
              type: jsPsychHtmlKeyboardResponse,
              stimulus: randomisationStimulus
            };

            const memory_display = {
              type: jsPsychHtmlKeyboardResponse,
              stimulus: () => `Memory ${selectedMemory}`
            };

            const end_trial = {
              type: jsPsychHtmlKeyboardResponse,
              stimulus: "This is the end of the experiment. Thank you!"
            };

            jsPsych.run([randomisation_trial, memory_display, end_trial]);
          }
        });
      }
    };