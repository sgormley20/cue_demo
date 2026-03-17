const PASSWORD = 'yourFixedPasswordHere';

// 1. Define experimentData and wrap it immediately for automatic saving
function createResponseProxy(obj) {
  return new Proxy(obj, {
    set(target, property, value) {
      target[property] = value;

      return true;
    }
  });
};

function createExperimentData() {
  return {
    experimenter: '',
    job_role: '',
    participant: '',
    session_number: null,
    memory_data: [],
    randomisation_group: null,
    selected_trauma_index: null,
    trauma_prompt: null,
    trauma_memory_reminder: null,
    selected_neutral_index: null,
    neutral_prompt: null,
    neutral_memory_reminder: null,
    responses: createResponseProxy({}),
    start_time: null,
    end_time: null,
    experiment_start: null,
    first_block_start: null,
    second_block_start: null
  };
}

const baseExperimentData = createExperimentData();

let experimentData = new Proxy(baseExperimentData, {
  set(target, property, value) {
    target[property] = value;

    return true;
  }
});

const likert_vivid_labels = [
  "Not at all Vivid", "A little Vivid", "Somewhat Vivid", "Moderately Vivid", "Considerably Vivid", "Very Vivid", "Extremley Vivid" 
]; 
const likert_pos_neg_labels =[
"Extremely Negative", "Very Negative", "Moderately Negative", "Neutral (neither positive or negative)", "Moderately Positive", "Very Positive", "Extremely Positive"
];
const likert_intensity_labels =[
"Not at all Emotionally Intense", "Slightly Emotionally Intense", "Somewhat Emotionally Intense", "Moderately Emotionally Intense", "Considerably Emotionally Intense", "Very Emotionally Intense", "Extremley Emotionally Intense"
];

function audioButtonHtml(src) {
  return `
    <button class="play-audio-btn" style="
      position: fixed; 
      bottom: 20px; 
      right: 20px; 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      border: none; 
      background-color: #007BFF; 
      color: white; 
      font-size: 18px;
      z-index: 1000;
      cursor: pointer;
    ">&#9658;</button>

    <audio class="instruction-audio" src="${src}"></audio>
  `;
}

function attachAudioButton() {
  const btn = document.querySelector(".play-audio-btn");
  const audio = document.querySelector(".instruction-audio");

  if (!btn || !audio) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();   // prevents jsPsych detecting the click
    e.preventDefault();

    audio.currentTime = 0;
    audio.play();

    document.body.focus();
  });
};

function recordBlockStart() {
  const now = new Date().toLocaleString();

  if (!experimentData.first_block_start) {
    experimentData.first_block_start = now;
  } else if (!experimentData.second_block_start) {
    experimentData.second_block_start = now;
  }
}
function instructionScreen(text, audioFile = null, continueText = "Press any key to continue.") {

  let stimulus = `
    <div style="max-width: 800px; margin: auto; text-align: center; line-height: 1.6;">
      <div style="font-size: 22px;">
        ${text}
      </div>

      <div style="margin-top: 40px; font-size: 18px;">
        <p><strong>${continueText}</strong></p>
      </div>
    </div>
  `;

  if (audioFile) {
    stimulus += audioButtonHtml(audioFile);
  }

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: stimulus,
    on_load: audioFile ? attachAudioButton : undefined
  };
};

const jsPsych = initJsPsych({
  display_element: 'jspsych-target',
    on_finish: () => {
    console.log("Experiment finished");
  }
});
const timeline = [];



//  Main controller function
async function startExperiment() {
  // Step 1: Experimenter Name
 timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
      <p>Please enter the <strong>Experimenter's Name</strong>:</p>
      <input id="exp-initials-input" type="text" style="font-size: 18px; text-align: center;" autofocus />
      <p style="color:red;" id="error-message"></p>
      <button id="continue-button" style="margin-top: 20px; font-size: 18px;">Continue</button>
    </div>
  `,
  choices: "NO_KEYS",
  on_load: () => {
    const input = document.getElementById("exp-initials-input");
    const button = document.getElementById("continue-button");
    const error = document.getElementById("error-message");

    // Only allow letters and hyphens
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^a-zA-Z-\s]/g, '');
    });

    const submit = () => {
      const value = input.value.trim();
      if (value.length === 0) {
        error.textContent = "Please enter name.";
      } else {
        jsPsych.finishTrial({ exp_initials: value });
      }
    };

    button.addEventListener("click", submit);

    // Allow pressing Enter to submit
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submit();
      }
    });

    input.focus();
  },
  on_finish: data => {
    experimentData.experimenter = data.exp_initials;
  }
});


// Step 1: Experimenter Job Role
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
    <p><strong>Demo Mode</strong></p>
      <p>Please enter the <strong>Experimenter's Job Role</strong>:</p>
      <input id="exp-role-input" type="text" style="font-size: 18px; text-align: center;" autofocus />
      <p style="color:red;" id="error-message"></p>
      <button id="continue-button" style="margin-top: 20px; font-size: 18px;">Continue</button>
    </div>
  `,
  choices: "NO_KEYS",
  on_load: () => {
    const input = document.getElementById("exp-role-input");
    const button = document.getElementById("continue-button");
    const error = document.getElementById("error-message");

    // Only allow letters and hyphens
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^a-zA-Z-\s]/g, '');
    });

    const submit = () => {
      const value = input.value.trim();
      if (value.length === 0) {
        error.textContent = "Please enter role.";
      } else {
        jsPsych.finishTrial({ exp_role: value });
      }
    };

    button.addEventListener("click", submit);

    // Allow pressing Enter to submit
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submit();
      }
    });

    input.focus();
  },
  on_finish: data => {
    experimentData.job_role = data.exp_role;
  }
});

  // Step 2: Participant ID
  timeline.push({
    type: jsPsychSurveyText,
    questions: [{ prompt: "Please enter <strong>Participant ID:</strong>", name: 'participant_id', required: true }],
    on_finish: data => {
      experimentData.participant = data.response.participant_id.trim().toUpperCase();

   // Add participant ID as a property for all jsPsych data
    jsPsych.data.addProperties({ participant_id: experimentData.participant });

  }
});

  // Step 3: Session no.
timeline.push({
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `
    <style>
      /* Remove spinner arrows in Chrome, Safari, Edge, Opera */
      input[type=number]::-webkit-outer-spin-button,
      input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Remove spinner arrows in Firefox */
      input[type=number] {
        -moz-appearance: textfield;
      }
    </style>

    <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
      <p>Please enter the <strong>session number</strong> (1–5):</p>
      <input id="session-input" type="number" min="1" max="5" maxlength="1" inputmode="numeric" 
             style="font-size: 18px; width: 80px; text-align: center;" autofocus />
      <p style="color:red;" id="error-message"></p>
      <button id="continue-button" style="margin-top: 20px; font-size: 18px;">Continue</button>
    </div>
  `,
  choices: "NO_KEYS",
  on_load: () => {
    const input = document.getElementById("session-input");
    const error = document.getElementById("error-message");
    const button = document.getElementById("continue-button");

    // Prevent mouse scroll from changing the number
    input.addEventListener("wheel", e => e.preventDefault());

    // Prevent entering more than 1 digit
    input.addEventListener("input", () => {
      if (input.value.length > 1) {
        input.value = input.value.slice(0, 1);
      }
    });

    const submit = () => {
      const value = input.value.trim();
      const num = parseInt(value);

      if (!value || isNaN(num) || num < 1 || num > 5) {
        error.textContent = "Please enter a number between 1 and 5.";
      } else {
        jsPsych.finishTrial({ session_number: num });
      }
    };

    button.addEventListener("click", submit);

    // Allow pressing Enter to submit
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        submit();
      }
    });

    input.focus();
  },
  on_finish: data => {
    experimentData.session_number = data.session_number;
  }
});

// Step 4: Get Start time
  timeline.push({
  type: jsPsychCallFunction,
  func: () => {
    experimentData.start_time = new Date().toLocaleString();
  }

});

// Step 5: Run initials + ID to get participant before loading files

await jsPsych.run(timeline.slice(0, 5));

try {
  let encryptedText;
  try {
    const res = await fetch(`encrypted_${experimentData.participant}.txt`);
    if (!res.ok) throw new Error("Encrypted file not found");
    encryptedText = await res.text();
  } catch (err) {
    alert("Error: Could not load encrypted file for this participant.");
    throw err;
  }

  experimentData.randomisation_group = await decryptRandomisation(encryptedText, PASSWORD);

  if (![1, 2, 3].includes(experimentData.randomisation_group)) {
    throw new Error("Invalid randomisation group");
  }

  let csvText;
  try {
    const res = await fetch(`${experimentData.participant}_memories.csv`);
    if (!res.ok) throw new Error("CSV file not found");
    csvText = await res.text();
  } catch (err) {
    alert("Error: Could not load memory file for this participant.");
    throw err;
  }

  const rows = csvText.trim().split('\n');
  const headers = rows[0].split(',').map(h => h.trim());
  const traumaIndex = headers.indexOf("Trauma Memory");
  const neutralIndex = headers.indexOf("Neutral Memory");

  if (traumaIndex === -1 || neutralIndex === -1) {
    throw new Error("Missing memory headers in CSV");
  }

  experimentData.memory_data = rows.slice(1).map(row => {
    const values = row.split(',').map(v => v.trim());
    return {
      trauma: values[traumaIndex],
      neutral: values[neutralIndex]
    };
  });

  // rest of your timeline building continues here...

    // Step 7: Handover
      timeline.push(
        instructionScreen(
     '<p>Press any key and hand the laptop to the participant.</p>'
      ));

    
    // Step 8: Add instructions
    timeline.push({
      ...instructionScreen( `
      <p>In the next section, we will ask you to bring a memory to mind. </p>
      <p>This will either be an intrusive memory of the traumatic event OR a neutral memory.</p> 
      <p>These are the memories you discussed with the researcher on visit 1.</p>
`,
"audio/page_1.wav"),
    on_finish: () => {
    // Save the wall clock time when key was pressed
    experimentData.experiment_start = new Date().toLocaleString();
  }
});

timeline.push({
      ...instructionScreen(`
      <p>On Visit-1, we asked you to give each neutral and intrusive memory a title or label.</p>
      <p>These <strong>labels/titles</strong> were going to be <strong>your reminders</strong> for specific neutral or intrusive traumatic memories.</p>
      </div>
`,
  "audio/page_2.wav"
      )
});


timeline.push({
      ...instructionScreen( `

      <p>In the next section, you will see <u><strong>one</strong></u> of these reminders.</p>
      <p> When you see the reminder, you are asked to <u><strong><em>briefly</em></strong></u> bring the associated memory to mind until you can see it clearly in your mind’s eye.</p>
`,
    "audio/page_3.wav"
      )
});


timeline.push({
    ...instructionScreen(`
   
      <p>Please wait for the experimenter's instructions.</p>
   `,
    "audio/page_4.wav"
     )
});

   // Step 9: Add blocks in correct order/

    const traumaBlock = createMemoryBlock("trauma");
    const neutralBlock = createMemoryBlock("neutral")

    if (experimentData.randomisation_group === 3) {
      timeline.push(...neutralBlock, ...traumaBlock);
    } else {
      timeline.push(...traumaBlock, ...neutralBlock);
    }

    // Step 10: End screen
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `
      <p>Please press the button to end the experiment.</p>
        ${audioButtonHtml("audio/end.wav")}
      `,
      choices: ['End'],
      on_load: attachAudioButton,   
    on_finish: () => {
        console.log('Done.');
      }
    });
//Save Data 
function buildMemoryOutput(type) {

  const safeIndex = (val) => val != null ? val + 1 : null;

  const vivid = experimentData.responses[`${type}_likert_vivid`];
  const posNeg = experimentData.responses[`${type}_likert_pos_neg`];
  const intensity = experimentData.responses[`${type}_likert_intensity`];
  const selected = experimentData[`selected_${type}_index`];

  return {
    [`${type}_selected`]: safeIndex(selected),
    [`${type}_prompt`]: experimentData[`${type}_prompt`],
    [`${type}_memory_reminder`]: experimentData[`${type}_memory_reminder`],

    [`${type}_likert_vivid`]: safeIndex(vivid),
    [`${type}_likert_vivid_label`]: vivid != null ? likert_vivid_labels[vivid] : null,

    [`${type}_likert_pos_neg`]: safeIndex(posNeg),
    [`${type}_likert_pos_neg_label`]: posNeg != null ? likert_pos_neg_labels[posNeg] : null,

    [`${type}_likert_intensity`]: safeIndex(intensity),
    [`${type}_likert_intensity_label`]: intensity != null ? likert_intensity_labels[intensity] : null
  };
};
    // Step 11: Save data
timeline.push({
  type: jsPsychCallFunction,
  func: () => {
    experimentData.end_time = new Date().toLocaleString();

    const output = {
  experimenter_name: experimentData.experimenter,
  job_role: experimentData.job_role,
  participant_id: experimentData.participant,
  session_number: experimentData.session_number,

  start_time: experimentData.start_time,
  end_time: experimentData.end_time,
  experiment_start: experimentData.experiment_start,
  first_block_start: experimentData.first_block_start,
  second_block_start: experimentData.second_block_start,

  // trauma first, neutral second
  ...buildMemoryOutput("trauma"),
  ...buildMemoryOutput("neutral")
};
     
// Send to server for saving as CSV
console.log("Final experiment data:", output);
  }
});
// Step 12: Run the rest of the experiment
await jsPsych.run(timeline.slice(5));

} catch (err) {
  alert("Setup failed: " + err.message);
}
}

// ------------------ SUPPORTING FUNCTIONS ----------------------

async function decryptRandomisation(encryptedBase64, password) {
  const combinedBuffer = base64ToArrayBuffer(encryptedBase64);
  const combined = new Uint8Array(combinedBuffer);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const keyMaterial = await getKeyMaterial(password);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
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
  return crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

//Likert Helper
function buildLikertTrial({ type, nameSuffix, prompt, labels, audio, labelArray }) {
  const key = `${type}_${nameSuffix}`;

  return {
    type: jsPsychSurveyLikert,
    questions: [{
      name: key,
      prompt: `
        ${prompt}
        ${audioButtonHtml(audio)}
      `,
      labels: labels,
      required: true
    }],
    on_load: attachAudioButton,
    on_finish: data => {
      experimentData.responses[key] = data.response[key];
      experimentData.responses[`${key}_label`] = labelArray[data.response[key]];
    }
  };
}
// NEW GENERIC BLOCK (TEST VERSION)
function createMemoryBlock(type) {
  const isTrauma = type === "trauma";

  const selectedIndexKey = `selected_${type}_index`;
  const promptKey = `${type}_prompt`;
  const reminderKey = `${type}_memory_reminder`;

  const choiceName = `${type}_choice`;

  const intro1Text = isTrauma
    ? `
      <p>You will next see a word/phrase to remind you of your <strong>traumatic intrusive memory</strong></p>
      <p>When you see the reminder word or phrase, <em>briefly</em> bring the intrusive memory to mind <u><strong><em>until you see it clearly in your mind's eye.</em></strong></u></p>
      <p>Some people find it helpful to close their eyes to help them remember clearly.</p>
    `
    : `
      <p>You will next see a word/phrase to remind you of your <strong>neutral memory</strong></p>
      <p>When you see the reminder word or phrase, <em>briefly</em> bring the memory to mind <u><strong><em>until you see it clearly in your mind's eye.</em></strong></u></p>
      <p>Some people find it helpful to close their eyes to help them remember clearly.</p>
    `;

  const intro2Text = isTrauma
    ? `<p>Please remember, we only want to 'jog your memory'. We do not want you to become fully absorbed in the memory or to become very upset.</p>`
    : `<p>Please remember, we are asking you to <strong>recall a <u>neutral memory</u></strong>, not an emotionally upsetting one. This will be one of the neutral memories you told us about on Visit 1.</p>`;

  const intro3Text = isTrauma
    ? `
      <p>When the reminder word appears, please bring the associated memory to mind until you see it clearly in your mind's eye.</p>
      <p>Hold the memory in your mind for a few seconds until you connect with it emotionally, before allowing it to fade away.</p>
      <p>You will then be asked to provide some ratings for the memory.</p>
    `
    : `
      <p>When the reminder word appears, please bring the associated memory to mind until you see it clearly in your mind's eye.</p>
      <p>Hold the memory in your mind for a few seconds, before allowing it to fade away.</p>
      <p>You will then be asked to provide some ratings for the memory.</p>
    `;

  const audioPrefix = isTrauma ? "traumatic" : "neutral";

  return [
    {
      type: jsPsychCallFunction,
      func: recordBlockStart
    },

    instructionScreen(intro1Text, `audio/${audioPrefix}_1.wav`, "If you are ready, please press any key to continue."),
    instructionScreen(intro2Text, `audio/${audioPrefix}_2.wav`, "If you are ready, please press any key to continue."),
    instructionScreen(intro3Text, `audio/${audioPrefix}_3.wav`, "If you are ready, please press any key to continue."),

    {
      type: jsPsychSurveyMultiChoice,
      questions: [{
        prompt: `<p>Please select the ${type} memory you wish to work with today:</p>${audioButtonHtml(`audio/${audioPrefix}_4.wav`)}`,
        name: choiceName,
        options: () => experimentData.memory_data.map(m => m[type]),
        required: true
      }],
      on_load: attachAudioButton,
      on_finish: data => {
        const selected = data.response[choiceName];
        experimentData[selectedIndexKey] = experimentData.memory_data.findIndex(m => m[type] === selected);
      }
    },
  // START BUTTON
{
  type: jsPsychHtmlButtonResponse,
  stimulus: `<p>If you are ready, please press the start button to see the reminder word or phrase.</p>
    ${audioButtonHtml("audio/start.wav")}`,
  choices: ['Start'],
  on_load: attachAudioButton
},

// REMINDER DISPLAY
{
  type: jsPsychHtmlButtonResponse,
  stimulus: () => `
    <div style="max-width: 600px; margin: auto; text-align: center; font-size: 18px;">
      <p>${experimentData.memory_data[experimentData[selectedIndexKey]][type]}</p>
      <p style="margin-top: 30px; font-style: italic; color: #555;">
        Once you can clearly see the memory in your mind's eye please press the continue button.
      </p>
    </div>
    ${audioButtonHtml("audio/continue.wav")}
  `,
  choices: ['Continue'],
  on_load: attachAudioButton,
  on_finish: () => {
    return new Promise((resolve) => {
      const context = jsPsych.pluginAPI.audioContext();
      if (context) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 440;
        gain.gain.value = 0.2;

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start();
        oscillator.stop(context.currentTime + 0.2);
        oscillator.onended = () => resolve();
      } else {
        resolve();
      }
    });
  }
},

// HANDOVER TO EXPERIMENTER
instructionScreen(
  `<p>Please hand the computer back to the experimenter.</p>`,
  "audio/hand_back.wav"
),

// HAND BACK TO PARTICIPANT
instructionScreen(
  `<p>When ready, press any key and hand the computer back to the participant.</p>`
),

instructionScreen(
  `<p>Next, please complete the following questions about the memory</p>`,
  "audio/next.wav"
),

// PROMPT QUESTION
{
  type: jsPsychSurveyText,
  questions: [{
    prompt: `<p>"What was the reminder word/phrase you saw?"</p>
      ${audioButtonHtml("audio/question_1.wav")}`,
    name: promptKey,
    required: true
  }],
  on_load: attachAudioButton,
  on_finish: data => {
    experimentData[promptKey] = data.response[promptKey].trim();
  }
},
// MEMORY TYPE QUESTION
{
  type: jsPsychSurveyMultiChoice,
  questions: [{
    prompt: `<p>Did the word remind you of a traumatic memory or a neutral memory?</p>
      ${audioButtonHtml("audio/question_2.wav")}`,
    name: reminderKey,
    options: ["Traumatic Memory", "Neutral Memory"],
    required: true
  }],
  on_load: attachAudioButton,
  on_finish: data => {
    experimentData[reminderKey] = data.response[reminderKey];
  }
},
// LIKERT INTRO
instructionScreen(
  `
  <p>Please rate the memory on the following scales:</p>
  <p>1) Vividness – how clear, detailed or crisp was the memory?</p>
  <p>2) Positiveness-negativeness – was the memory associated with positive (good) or negative (bad) emotions, or neutral?</p>
  <p>3) Emotional intensity – how intense were your emotions when you recalled the memory?</p>
  `,
  "audio/rating_2.wav"
),
// VIVIDNESS
buildLikertTrial({
  type,
  nameSuffix: "likert_vivid",
  prompt: `<p>How vivid was the memory?</p>
           <p>Vividness – how clear, detailed or crisp was the memory?</p>`,
  audio: "audio/vivid.wav",
  labels: [
    '1<br><small>Not at all Vivid</small>',
    '2<br><small>A little Vivid</small>',
    '3<br><small>Somewhat Vivid</small>',
    '4<br><small>Moderately Vivid</small>',
    '5<br><small>Considerably Vivid</small>',
    '6<br><small>Very Vivid</small>',
    '7<br><small>Extremely Vivid</small>'
  ],
  labelArray: likert_vivid_labels
}),

// POSITIVE / NEGATIVE
buildLikertTrial({
  type,
  nameSuffix: "likert_pos_neg",
  prompt: `<p>How Positive/Negative was the memory?</p>
           <p>Positiveness-negativeness – was the memory associated with positive or negative emotions, or neutral?</p>`,
  audio: "audio/positive.wav",
  labels: [
    '1<br><small>Extremely Negative</small>',
    '2<br><small>Very Negative</small>',
    '3<br><small>Moderately Negative</small>',
    '4<br><small>Neutral</small>',
    '5<br><small>Moderately Positive</small>',
    '6<br><small>Very Positive</small>',
    '7<br><small>Extremely Positive</small>'
  ],
  labelArray: likert_pos_neg_labels
}),

// INTENSITY
buildLikertTrial({
  type,
  nameSuffix: "likert_intensity",
  prompt: `<p>How emotionally intense was the memory?</p>
           <p>Emotional intensity – how intense were your emotions?</p>`,
  audio: "audio/intensity.wav",
  labels: [
    '1<br><small>Not at all Emotionally Intense</small>',
    '2<br><small>Slightly Emotionally Intense</small>',
    '3<br><small>Somewhat Emotionally Intense</small>',
    '4<br><small>Moderately Emotionally Intense</small>',
    '5<br><small>Considerably Emotionally Intense</small>',
    '6<br><small>Very Emotionally Intense</small>',
    '7<br><small>Extremely Emotionally Intense</small>'
  ],
  labelArray: likert_intensity_labels
}),
];
}

//  Start the flow
startExperiment();
