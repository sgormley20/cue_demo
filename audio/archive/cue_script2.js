const PASSWORD = 'yourFixedPasswordHere';  

const experimentData = {
  experimenter: '',
  participant: '',
  experiment_start: null,
  memory_data: [],
  selected_trauma_index: null,
  selected_neutral_index: null,
  start_time: null,
  end_time: null,
  responses: {},
  randomisation_group: null,
  load_failed: false
};

const jsPsych = initJsPsych();
const timeline = [];

// Step 1: Experimenter initials
timeline.push({
  type: jsPsychSurveyText,
  questions: [{ prompt: "Enter experimenter initials:", name: 'exp_initials', required: true }],
  on_finish: data => {
    const response = data.response;
    experimentData.experimenter = response.exp_initials.trim();
  }
});

// Step 2: Participant ID
timeline.push({
  type: jsPsychSurveyText,
  questions: [{ prompt: "Enter participant ID number:", name: 'participant_id', required: true }],
  on_finish: async (data) => {
    experimentData.participant = data.response.participant_id.trim();

    //Fetch and decrypt randomisation
    try {
      const encryptedFilename = `encrypted_${experimentData.participant}.txt`;
      const response = await fetch(encryptedFilename);
      if (!response.ok) throw new Error("Encrypted file not found");
      const encryptedText = await response.text();

      // Decrypt the text
      experimentData.randomisation_group = await decryptRandomisation(encryptedText, PASSWORD);

      if (![1, 2, 3].includes(experimentData.randomisation_group)) {
        throw new Error(`Invalid randomisation group: ${experimentData.randomisation_group}`);
      }
    } catch (error) {
      console.error('Failed to load/decrypt randomisation:', error);
      alert('Could not load or decrypt randomisation file. Please check participant ID and file.');
      experimentData.load_failed = true;
    }
  }
});
  
// Step 3: Load CSV
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: "<p>Loading participant memory file...</p>",
  trial_duration: 100,
  on_start: async (trial) => {
    const filePath = `${experimentData.participant}_memories.csv`;
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error("File not found");
      const text = await response.text();
      const rows = text.trim().split('\n');
      const headers = rows[0].split(',').map(h => h.trim());
      const traumaIndex = headers.indexOf("Trauma Memory");
      const neutralIndex = headers.indexOf("Neutral Memory");

      experimentData.memory_data = rows.slice(1).map(row => {
        const cols = row.split(',');
        return {
          trauma: cols[traumaIndex]?.trim(),
          neutral: cols[neutralIndex]?.trim()
        };
      });

    } catch (error) {
      // Just set a flag – don't try to halt timeline here
      experimentData.load_failed = true;
    }
  }
});

// Step 3b: If loading failed, show error and halt the experiment
timeline.push({
  timeline: [{
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => {
      return `<p style="color:red;">Could not load the memory file for participant "${experimentData.participant}".<br>
              Please check the filename and restart the experiment.</p>`;
    },
    choices: "NO_KEYS",
    trial_duration: null
  }],
  conditional_function: () => {
    return experimentData.load_failed === true;
  }
});

// Step 4: Handover
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<p>Press any key and hand the laptop to the participant.</p>'
});

// Step 5: Instructions
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: '<p>Instructions go here.</p><p>Press any key to continue.</p>',
});

//Step 6: Ready Screen 
timeline.push({
  type: jsPsychHtmlButtonResponse, 
  stimulus: '<p> Please press the button to start, when the experimenter tells you to. </p>', 
  choices: ['Start'],
  on_finish: data => {
    // Save the wall clock time when key was pressed
    experimentData.experiment_start = new Date().toLocaleString();
  }
});

// Step 7: Define Trauma Block
// --- Define trauma memory block ---
function createTraumaMemoryBlock() {
  return [
    {
      type: jsPsychSurveyMultiChoice,
      questions: [{
        prompt: 'Please select one traumatic memory:',
        name: 'trauma_choice',
        options: () => experimentData.memory_data.map(m => m.trauma),
        required: true
      }],
      on_finish: data => {
        const response = data.response;
        experimentData.selected_trauma_index = experimentData.memory_data.findIndex(m => m.trauma === response.trauma_choice);
      }
    },
    {type: jsPsychHtmlButtonResponse,
       stimulus: '<p>Press the button below when you are ready to begin.</p>',
      choices: ['Start']
    },
    {
      type: jsPsychHtmlButtonResponse,
      stimulus: () => `<p>${experimentData.memory_data[experimentData.selected_trauma_index].trauma}</p>`,
      choices: ['Continue']
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'trauma_likert_1',
        prompt: `Trauma Likert scale 1`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.trauma_likert_1 = data.response.trauma_likert_1;
      }
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'trauma_likert_2',
        prompt: `Trauma Likert scale 2`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.trauma_likert_2 = data.response.trauma_likert_2;
      }
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'trauma_likert_3',
        prompt: `Trauma Likert scale 3`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.trauma_likert_3 = data.response.trauma_likert_3;
      }
    }
  ];
}

// Step 8: Define Neutral Memory Block
function createNeutralMemoryBlock() {
  return [
    {
      type: jsPsychSurveyMultiChoice,
      questions: [{
        prompt: 'Please select one neutral memory:',
        name: 'neutral_choice',
        options: () => experimentData.memory_data.map(m => m.neutral),
        required: true
      }],
      on_finish: data => {
        const response = data.response;
        experimentData.selected_neutral_index = experimentData.memory_data.findIndex(m => m.neutral === response.neutral_choice);
      }
    },
      {type: jsPsychHtmlButtonResponse,
       stimulus: '<p>Press the button below when you are ready to begin.</p>',
      choices: ['Start']
    },
    {
      type: jsPsychHtmlButtonResponse,
      stimulus: () => `<p>${experimentData.memory_data[experimentData.selected_neutral_index].neutral}</p>`,
      choices: ['Continue']
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'neutral_likert_1',
        prompt: `Neutral Likert scale 1`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.neutral_likert_1 = data.response.neutral_likert_1;
      }
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'neutral_likert_2',
        prompt: `Neutral Likert scale 2`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.neutral_likert_2 = data.response.neutral_likert_2;
      }
    },
    {
      type: jsPsychSurveyLikert,
      questions: [{
        name: 'neutral_likert_3',
        prompt: `Neutral Likert scale 3`,
        labels: ['1', '2', '3', '4', '5'],
        required: true
      }],
      on_finish: data => {
        experimentData.responses.neutral_likert_3 = data.response.neutral_likert_3;
      }
    }
  ];
}

// Step 7: Dynamically add trauma/neutral blocks based on randomisation_group
timeline.push({
  timeline: [],
  conditional_function: () => !experimentData.load_failed,
  on_timeline_start: () => {
    // Dynamically push correct blocks in order
    const lastTimeline = timeline[timeline.length - 1];
    lastTimeline.timeline = [];  // clear in case

    if (experimentData.randomisation_group === 3) {
      lastTimeline.timeline.push(...createNeutralMemoryBlock(), ...createTraumaMemoryBlock());
    } else {
      lastTimeline.timeline.push(...createTraumaMemoryBlock(), ...createNeutralMemoryBlock());
    }
  }
});

// Capture Start Time (just before running memory blocks)
timeline.push({
  type: jsPsychCallFunction,
  func: () => {
    experimentData.start_time = new Date().toLocaleString();
  }
});

// Step 10: End message
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: '<p>Press the button below to end the experiment.</p>',
  choices: ['End']
});

// Step 11: Save data
timeline.push({
  type: jsPsychCallFunction,
  func: () => {
    experimentData.end_time = new Date().toLocaleString();

    const output = {
      experimenter_initials: experimentData.experimenter,
      participant_id: experimentData.participant,
      start_time: experimentData.start_time,
      end_time: experimentData.end_time,
      experiment_start: experimentData.experiment_start,
      
      // Always trauma data first, neutral second
      trauma_selected: experimentData.selected_trauma_index + 1,
      trauma_likert: [
        experimentData.responses.trauma_likert_1,
        experimentData.responses.trauma_likert_2,
        experimentData.responses.trauma_likert_3
      ],

      neutral_selected: experimentData.selected_neutral_index + 1,
      neutral_likert: [
        experimentData.responses.neutral_likert_1,
        experimentData.responses.neutral_likert_2,
        experimentData.responses.neutral_likert_3
      ]
    };

    // Create and trigger download of JSON file
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experimentData.participant}_output.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    jsPsych.end();
  }
});

// Step 12: Decryption function
async function decryptRandomisation(encryptedBase64, password) {
  const combinedBuffer = base64ToArrayBuffer(encryptedBase64);
  const combined = new Uint8Array(combinedBuffer);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const keyMaterial = await getKeyMaterial(password);
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);

  const parsed = JSON.parse(decryptedText);
  return parseInt(parsed[0].group, 10);
}

async function getKeyMaterial(password) {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Start the experiment
jsPsych.run(timeline);