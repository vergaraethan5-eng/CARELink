// ==================== THEME SWITCHER ====================

// Initialize theme from localStorage - applies to entire website
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  // Apply theme to html element so it cascades to entire website
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

// Toggle between light and dark themes
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  
  // Update Chart.js chart if it exists (for pie chart)
  if (typeof updatePieChart === 'function') {
    setTimeout(updatePieChart, 100);
  }
}

// Update theme toggle button icon
function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (!icon) return;

  // Use code points to avoid encoding issues in source files.
  const sun = String.fromCodePoint(0x2600, 0xFE0F); // U+2600 U+FE0F
  const moon = String.fromCodePoint(0x1F319); // U+1F319
  icon.textContent = theme === 'dark' ? sun : moon;
}

// Initialize theme on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
  initializeTheme();
}

// Login page face animation
function startLoginFaceAnimation(){
  const faces = document.querySelectorAll('.login-face');
  const moods = ['happy','sad','stressed','angry','scared','neutral'];
  setInterval(()=>{
    faces.forEach(f=>{
      const randomMood = moods[Math.floor(Math.random()*moods.length)];
      f.className='login-face '+randomMood;
    });
  }, 2000);
}

// Trigger animation only when the login faces exist (prevents background timers on other pages).
if (document.getElementById('loginFaces')) {
  document.addEventListener('DOMContentLoaded', startLoginFaceAnimation);
}

// ==================== MOOD ASSESSMENT SYSTEM ====================

// Track selected moods and factors
let selectedMoods = [];
let selectedFactors = [];
let selectedActivities = [];

// ==================== MOOD EMOJIS & BADGES ====================
const moodEmojis = {
  excited: '🤩',
  happy: '😊',
  sad: '😢',
  stressed: '😰',
  drained: '😴'
};

let recentMoods = []; // Persistent recent moods for badges

// ==================== MOOD STATISTICS TRACKING ====================

// Track mood clicks for statistics (1-5 scale for 5 moods)
let moodStats = {
  excited: 0,
  happy: 0,
  sad: 0,
  stressed: 0,
  drained: 0
};

let moodChart = null;

// Save stats to localStorage
function saveMoodStats() {
  localStorage.setItem('moodStats', JSON.stringify(moodStats));
}

// Load stats from localStorage
function loadMoodStats() {
  const saved = localStorage.getItem('moodStats');
  if (saved) {
    moodStats = JSON.parse(saved);
  }
}

// Update mood statistics display

function updateStatisticsDisplay() {
  const total = Object.values(moodStats).reduce((a, b) => a + b, 0);
  
  // Update legend with counts
  Object.keys(moodStats).forEach(mood => {
    const count = moodStats[mood];
    const statElement = document.getElementById(`stat-${mood}`);
    if (statElement) {
      statElement.textContent = count;
    }
  });
  
  // Update or create pie chart
  updatePieChart();
}

function updatePieChart() {
  const chartCanvas = document.getElementById('moodPieChart');
  if (!chartCanvas) return;

  // Destroy existing chart
  if (moodChart) {
    moodChart.destroy();
    moodChart = null;
  }

  // Define vibrant mood-specific colors
  const moodColors = {
    excited: '#10B981',    // Green - Excited Energy
    happy: '#FFB037',      // Golden Yellow - Happy/Warm
    sad: '#54A0FF',        // Soft Blue - Sadness
    stressed: '#EE5A6F',   // Coral - Stress/Tension
    drained: '#A55EEA'     // Purple - Drained/Tired
  };

  // Find the most selected mood for highlight
  let mostSelectedMood = null;
  let maxCount = 0;
  Object.entries(moodStats).forEach(([mood, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostSelectedMood = mood;
    }
  });

  const moods = ['excited', 'happy', 'sad', 'stressed', 'drained'];
  const data = moods.map(m => moodStats[m] || 0);
  const colors = moods.map(m => moodColors[m]);

  // Adjust colors for theme awareness
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const adjustedColors = colors.map(color => {
    if (isDark) {
      // Darken colors slightly for better contrast in dark mode
      return color.replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/, (m, r, g, b) => {
        const ri = parseInt(r, 16), gi = parseInt(g, 16), bi = parseInt(b, 16);
        return '#' + Math.max(0, ri - 20).toString(16).padStart(2, '0') +
                     Math.max(0, gi - 20).toString(16).padStart(2, '0') +
                     Math.max(0, bi - 20).toString(16).padStart(2, '0');
      });
    }
    return color;
  });

  // Create highlight colors for max mood (slightly brighter)
  const highlightColors = adjustedColors.map((color, index) => {
    if (moods[index] === mostSelectedMood && maxCount > 0) {
      return color.replace('#', isDark ? '#AA' : '#FF').slice(0, -2) + (isDark ? 'FF' : 'FF');
    }
    return color + (isDark ? 'CC' : 'FF');
  });

  const ctx = chartCanvas.getContext('2d');
  moodChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: moods.map(m => m.charAt(0).toUpperCase() + m.slice(1)),
      datasets: [{
        data: data,
        backgroundColor: adjustedColors,
        borderColor: isDark ? '#334155' : '#ffffff',
        borderWidth: 4,
        hoverBackgroundColor: highlightColors,
        hoverBorderWidth: 5
      }]
    },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#f1f5f9' : '#1e293b',
          bodyColor: isDark ? '#94a3b8' : '#64748b',
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1500
      }
    }
  });

  updateMostSelectedMoodIndicator(mostSelectedMood);
}



// Update visual indicator for most selected mood
function updateMostSelectedMoodIndicator(mostSelectedMood) {
  // Remove all pulse animations
  document.querySelectorAll('.stat-color').forEach(el => {
    el.style.animation = 'none';
  });
  
  if (!mostSelectedMood) return;
  
  // Apply pulse animation to the right mood
  const moodIndex = ['excited', 'happy', 'sad', 'stressed', 'drained'].indexOf(mostSelectedMood);
  if (moodIndex >= 0) {
    const colors = document.querySelectorAll('.stat-color');
    if (colors[moodIndex]) {
      const animations = ['moodPulse', 'happyPulse', 'sadPulse', 'stressedPulse', 'drainedPulse'];
      colors[moodIndex].style.animation = `${animations[moodIndex]} 1.5s ease-in-out infinite`;
    }
  }
}

// Helper function to get mood color
function getMostSelectedMoodColor(mood) {
  const moodColors = {
    excited: 'rgba(255, 71, 87, 0.9)',
    happy: 'rgba(255, 176, 55, 0.9)',
    sad: 'rgba(84, 160, 255, 0.9)',
    stressed: 'rgba(238, 90, 111, 0.9)',
    drained: 'rgba(165, 94, 234, 0.9)'
  };
  return moodColors[mood] || 'rgba(0, 0, 0, 0.8)';
}

// Clear all mood statistics and reset UI
function clearMoodStatistics() {
  if (confirm('Are you sure you want to reset all mood statistics and clear mood selections?')) {
    // Destroy chart
    if (moodChart) {
      moodChart.destroy();
      moodChart = null;
    }

    // Reset stats
    moodStats = {
      excited: 0,
      happy: 0,
      sad: 0,
      stressed: 0,
      drained: 0
    };
    saveMoodStats();
    
    // Reset selections
    selectedMoods = [];
    selectedFactors = [];
    recentMoods = [];
    localStorage.removeItem('recentMoods');
    
    // Remove selected styling from mood cards
    document.querySelectorAll('.mood-card.selected').forEach(card => {
      card.classList.remove('selected');
    });
    
    // Hide sections
    document.getElementById('factorsSection').style.display = 'none';
    document.getElementById('activityRecommendations').style.display = 'none';
    renderMoodBadges();
    
    // Update statistics display
    updateStatisticsDisplay();
  }
}

// ==================== MOOD BADGES FUNCTIONS ====================

function loadRecentMoods() {
  const saved = localStorage.getItem('recentMoods');
  if (saved) {
    recentMoods = JSON.parse(saved);
  }
  renderMoodBadges();
}

function renderMoodBadges() {
  const container = document.getElementById('moodBadges');
  if (!container) return;
  
  if (recentMoods.length === 0) {
    container.innerHTML = '<div class="mood-badge-empty">🎟️ Select moods to see your badges here</div>';
    return;
  }
  
  container.innerHTML = recentMoods.map((moodData, index) => 
    `<span class="mood-badge" data-index="${index}" title="${moodData.mood} - ${new Date(moodData.timestamp).toLocaleDateString()}">${moodData.emoji}</span>`
  ).join('');
}

function clearMoodBadges() {
  if (confirm('Clear all mood badges? This will remove your recent moods history.')) {
    recentMoods = [];
    selectedMoods = [];
    localStorage.removeItem('recentMoods');
    renderMoodBadges();
    
    // Reset UI
    document.querySelectorAll('.mood-card.selected').forEach(card => {
      card.classList.remove('selected');
    });
    document.getElementById('factorsSection').style.display = 'none';
    document.getElementById('activityRecommendations').style.display = 'none';
  }
}



// Mood-Factor mapping - factors that commonly cause specific moods
const moodFactorOptions = {
  excited: ['New Opportunity', 'Social Event', 'Good News', 'Achievement', 'Coffee/Caffeine'],
  happy: ['Friends', 'Success', 'Good Weather', 'Learning Something', 'Favorite Activity'],
  sad: ['Loss or Disappointment', 'Loneliness', 'Difficult Situation', 'Failure', 'Bad News'],
  stressed: ['Deadlines', 'Too Many Tasks', 'Conflict', 'Uncertainty', 'Lack of Sleep'],
  drained: ['Overwork', 'Emotional Exhaustion', 'Too Many Commitments', 'Physical Illness', 'Poor Sleep']
};

// Activity recommendations mapped to moods with vetting for mental wellness
// Now includes actual materials for each activity
const activityRecommendations = {
  excited: [
    { 
      name: 'Channel Energy Into Creative Project', 
      category: 'creativity', 
      benefit: 'Convert excitement into productive output',
      materials: [
        { type: 'video', title: 'Creative Flow State Guide', url: 'https://www.youtube.com/watch?v=fKepFP2R-g0' },
        { type: 'resource', title: 'Creative Project Ideas & Prompts', url: 'https://www.boredpanda.com/creative-writing-prompts/' },
        { type: 'template', title: 'Project Planning Worksheet', content: 'Set clear goals, break into tasks, define timeline' }
      ]
    },
    { 
      name: 'Social Connection Activity', 
      category: 'social', 
      benefit: 'Share your energy with others',
      materials: [
        { type: 'guide', title: 'Activity Ideas to Share', content: 'Game night, group workout, coffee chat, volunteer together' },
        { type: 'video', title: '5 Ways to Build Better Connections', url: 'https://www.youtube.com/watch?v=T3bOEaYbfvE' },
        { type: 'resource', title: 'Social Event Planning Tips', url: 'https://www.eventbrite.com/blog/' }
      ]
    },
    { 
      name: 'Physical Exercise', 
      category: 'physical', 
      benefit: 'Maintain momentum with movement',
      materials: [
        { type: 'video', title: 'High-Energy 15-Min Workout', url: 'https://www.youtube.com/watch?v=ml0sorsKKu8' },
        { type: 'app', title: 'Recommended Apps', content: 'Strava, Nike Training Club, Peloton Digital' },
        { type: 'guide', title: 'Exercise Types That Match Your Energy', content: 'Dancing, running, HIIT, team sports, martial arts' }
      ]
    },
    { 
      name: 'Goal Planning Session', 
      category: 'planning', 
      benefit: 'Direct energy toward meaningful goals',
      materials: [
        { type: 'template', title: 'SMART Goals Worksheet', content: 'Specific, Measurable, Achievable, Relevant, Time-bound' },
        { type: 'video', title: 'Goal Setting Framework', url: 'https://www.youtube.com/watch?v=36S8anQI0sY' },
        { type: 'resource', title: 'Productivity Planner', url: 'https://bulletjournal.com/' }
      ]
    }
  ],
  happy: [
    { 
      name: 'Gratitude Journaling', 
      category: 'mindfulness', 
      benefit: 'Anchor positive emotions',
      materials: [
        { type: 'template', title: 'Gratitude Journal Prompts', content: '3 good things, why they happened, who to thank, small joys today' },
        { type: 'guide', title: 'How to Start Journaling', content: 'Write freely, daily 5-10 mins, no judgment, reflect weekly' },
        { type: 'app', title: 'Recommended Apps', content: 'Day One, Reflectly, Jour' }
      ]
    },
    { 
      name: 'Help Someone In Need', 
      category: 'social', 
      benefit: 'Spread happiness to others',
      materials: [
        { type: 'resource', title: 'Volunteer Opportunities', url: 'https://www.volunteertogether.org/' },
        { type: 'guide', title: 'Ways to Help Today', content: 'Listen to a friend, help with chores, send encouraging message, buy lunch' },
        { type: 'video', title: 'Why Acts of Kindness Matter', url: 'https://www.youtube.com/watch?v=a4J4iY9lfU0' }
      ]
    },
    { 
      name: 'Celebrate with Friends', 
      category: 'social', 
      benefit: 'Share your positive mood',
      materials: [
        { type: 'guide', title: 'Celebration Ideas', content: 'Dinner out, game night, movie marathon, picnic, concert' },
        { type: 'resource', title: 'Event Planning Tools', url: 'https://doodle.com/' },
        { type: 'video', title: 'Making Memories Matter', url: 'https://www.youtube.com/watch?v=WvYoJxEzJl0' }
      ]
    },
    { 
      name: 'Pursue a Hobby', 
      category: 'leisure', 
      benefit: 'Enhance your contentment',
      materials: [
        { type: 'resource', title: 'Hobby Ideas & Tutorials', url: 'https://www.skillshare.com/' },
        { type: 'guide', title: 'Getting Started Guide', content: 'Choose hobby, gather supplies, set schedule, join community' },
        { type: 'app', title: 'Hobby Tracking Apps', content: 'Habitica, Streaks, Done' }
      ]
    }
  ],
  sad: [
    { 
      name: 'Guided Conversation with Counselor', 
      category: 'professional', 
      benefit: 'Professional support for emotional processing',
      materials: [
        { type: 'guide', title: 'How to Talk to a Counselor', content: 'Preparation tips, questions to ask, what to expect, follow-up' },
        { type: 'resource', title: 'SLU Counseling Services', url: 'https://www.slu.edu.ph' },
        { type: 'hotline', title: 'Crisis Support', content: 'National Hotline: 2919 | Crisis Text Line: Text HOME to 741741' }
      ]
    },
    { 
      name: 'Gentle Yoga or Stretching', 
      category: 'physical', 
      benefit: 'Release tension and improve mood',
      materials: [
        { type: 'video', title: 'Calming Yoga for Sadness', url: 'https://www.youtube.com/watch?v=g4zfVpLPUZ4' },
        { type: 'app', title: 'Yoga Apps', content: 'Down Dog, Asana Rebel, YouTube Yoga channels' },
        { type: 'guide', title: 'Stretching Guide', content: 'Neck, shoulders, back, legs - hold 20-30 seconds, breathe deeply' }
      ]
    },
    { 
      name: 'Creative Expression (Art/Music/Writing)', 
      category: 'creativity', 
      benefit: 'Process emotions through creation',
      materials: [
        { type: 'video', title: 'Art Therapy for Emotion Release', url: 'https://www.youtube.com/watch?v=16fxjS5Nt_w' },
        { type: 'template', title: 'Emotion Journaling Prompts', content: 'How does sadness feel? What would comfort me? Letter to myself?' },
        { type: 'resource', title: 'Music & Art Resources', url: 'https://www.creativebug.com/' }
      ]
    },
    { 
      name: 'Nature Walk', 
      category: 'physical', 
      benefit: 'Fresh air and natural mood elevation',
      materials: [
        { type: 'guide', title: 'Mindful Walking Guide', content: 'Find quiet spot, notice 5 senses, go 15-20 mins, journal after' },
        { type: 'app', title: 'Nature Apps', content: 'AllTrails, Merlin Bird ID, iNaturalist' },
        { type: 'resource', title: 'Local Parks & Trails', url: 'https://www.alltrails.com/' }
      ]
    },
    { 
      name: 'Comfort Activity with Friend', 
      category: 'social', 
      benefit: 'Social support and connection',
      materials: [
        { type: 'guide', title: 'How to Ask for Support', content: 'Be honest, specific about what helps, listen to friend too' },
        { type: 'idea', title: 'Comfort Activities', content: 'Movie together, cooking, talking, tea/coffee, sitting in silence' },
        { type: 'resource', title: 'Friend Support Groups', url: 'https://www.meetup.com/' }
      ]
    }
  ],
  stressed: [
    { 
      name: 'Meditation or Breathwork', 
      category: 'mindfulness', 
      benefit: 'Calm nervous system',
      materials: [
        { type: 'video', title: '5-Minute Guided Meditation', url: 'https://www.youtube.com/watch?v=inpok4MKVLM' },
        { type: 'app', title: 'Meditation Apps', content: 'Headspace, Calm, Insight Timer, Ten Percent Happier' },
        { type: 'technique', title: 'Box Breathing Exercise', content: 'Breathe in 4, hold 4, breathe out 4, hold 4 - repeat 5 mins' }
      ]
    },
    { 
      name: 'Progressive Muscle Relaxation', 
      category: 'physical', 
      benefit: 'Release physical tension',
      materials: [
        { type: 'video', title: 'Progressive Muscle Relaxation Guide', url: 'https://www.youtube.com/watch?v=tnxsqjYHgEg' },
        { type: 'guide', title: 'Step-by-Step Instructions', content: 'Tense each muscle 5 secs, release 10 secs, full body 15-20 mins' },
        { type: 'script', title: 'Guided Script (Read Aloud)', content: 'Available in resources section' }
      ]
    },
    { 
      name: 'Task Prioritization & Planning', 
      category: 'planning', 
      benefit: 'Regain sense of control',
      materials: [
        { type: 'template', title: 'Priority Matrix (Eisenhower Box)', content: 'Urgent/Important, schedule tasks, delegate when possible' },
        { type: 'app', title: 'Task Management Tools', content: 'Todoist, Notion, Microsoft To Do, Trello' },
        { type: 'video', title: 'Stress-Free Productivity System', url: 'https://www.youtube.com/watch?v=CHvDqnzz_9g' }
      ]
    },
    { 
      name: 'Physical Exercise (Cardio)', 
      category: 'physical', 
      benefit: 'Stress hormone reduction',
      materials: [
        { type: 'video', title: 'Stress-Relief Workout (20 mins)', url: 'https://www.youtube.com/watch?v=_OTWVV93aE4' },
        { type: 'guide', title: 'Best Cardio for Stress', content: 'Running, cycling, swimming, dancing, brisk walking - 20-30 mins' },
        { type: 'app', title: 'Fitness Tracking', content: 'Strava, Nike Training Club, Apple Fitness+' }
      ]
    },
    { 
      name: 'Aromatherapy or Calming Tea', 
      category: 'selfcare', 
      benefit: 'Sensory relaxation',
      materials: [
        { type: 'guide', title: 'Calming Scents & Tea Guide', content: 'Lavender, chamomile, peppermint, lemon balm, valerian root' },
        { type: 'recipe', title: 'Calming Tea Recipe', content: 'Chamomile + honey + lemon, or valerian + passionflower' },
        { type: 'resource', title: 'Essential Oils & Teas', url: 'https://www.traditionalmedicals.com/' }
      ]
    }
  ],
  drained: [
    { 
      name: 'Rest and Sleep Enhancement', 
      category: 'selfcare', 
      benefit: 'Physical recovery',
      materials: [
        { type: 'guide', title: 'Sleep Hygiene Tips', content: 'Dark room, cool temp, consistent schedule, no screens 1 hour before' },
        { type: 'video', title: 'Sleep Meditation (30 mins)', url: 'https://www.youtube.com/watch?v=j10wPHyBn1s' },
        { type: 'app', title: 'Sleep Apps', content: 'Sleep Cycle, Pillow, Rizu Sleep, Calm Sleep Stories' }
      ]
    },
    { 
      name: 'Meditation for Energy Restoration', 
      category: 'mindfulness', 
      benefit: 'Mental recovery',
      materials: [
        { type: 'video', title: 'Energy Restoration Meditation', url: 'https://www.youtube.com/watch?v=6NjFDN00aW4' },
        { type: 'app', title: 'Meditation Apps', content: 'Headspace Energy sessions, Calm Power Nap series' },
        { type: 'technique', title: 'Power Nap Technique', content: '20-minute nap in dark space, set alarm, wake refreshed' }
      ]
    },
    { 
      name: 'Nutrition & Hydration Focus', 
      category: 'selfcare', 
      benefit: 'Restore physical resources',
      materials: [
        { type: 'guide', title: 'Energizing Foods Guide', content: 'Iron-rich foods, B vitamins, whole grains, nuts, fruits' },
        { type: 'recipe', title: 'Energy Boost Recipes', content: 'Smoothie bowls, salads with protein, herbal teas' },
        { type: 'app', title: 'Nutrition Trackers', content: 'MyFitnessPal, Cronometer' }
      ]
    },
    { 
      name: 'Gentle Activity (Slow Yoga)', 
      category: 'physical', 
      benefit: 'Rebuild energy gradually',
      materials: [
        { type: 'video', title: 'Gentle Restorative Yoga (30 mins)', url: 'https://www.youtube.com/watch?v=P4H_-9XaTt4' },
        { type: 'app', title: 'Yoga Apps', content: 'Down Dog, Yoga with Adriene (Restorative playlists)' },
        { type: 'guide', title: 'Restorative Poses', content: 'Child\'s pose, legs-up-the-wall, reclined butterfly, supported forward fold' }
      ]
    },
    { 
      name: 'Boundary Setting Discussion', 
      category: 'planning', 
      benefit: 'Prevent future exhaustion',
      materials: [
        { type: 'guide', title: 'How to Set Healthy Boundaries', content: 'Identify limits, communicate clearly, say no guilt-free, enforce consistently' },
        { type: 'template', title: 'Personal Values & Limits Worksheet', content: 'What drains you? What energizes you? Where to say no?' },
        { type: 'resource', title: 'Boundary Setting Resources', url: 'https://www.psychologytoday.com/basics/boundaries' }
      ]
    }
  ]
};

// Toggle mood selection - allows multiple moods
function toggleMoodSelection(mood, event) {
  event.preventDefault();
  
  const card = event.currentTarget;
  
  if (selectedMoods.includes(mood)) {
    selectedMoods = selectedMoods.filter(m => m !== mood);
    card.classList.remove('selected');
  } else {
    selectedMoods.push(mood);
    card.classList.add('selected');
    
    // Track mood click
    moodStats[mood] = (moodStats[mood] || 0) + 1;
    saveMoodStats();
    updateStatisticsDisplay();

    // Add to recent moods for badges
recentMoods.unshift({mood: mood, timestamp: Date.now(), emoji: moodEmojis[mood]});
    if (recentMoods.length > 10) recentMoods = recentMoods.slice(0, 10);
    localStorage.setItem('recentMoods', JSON.stringify(recentMoods));
    
    // Set data-mood for CSS styling
    const badgeElements = document.querySelectorAll('.mood-badge');
    badgeElements.forEach(badge => {
      const moodData = recentMoods[parseInt(badge.dataset.index)];
      if (moodData) badge.dataset.mood = moodData.mood;
    });
    
    renderMoodBadges();

    // UI feedback
    assignMoodToFace(mood);
    displayMoodFeedback(mood);
  }
  
  // Show/hide factors section based on mood selection
  if (selectedMoods.length > 0) {
    displayFactorsSection();
  } else {
    document.getElementById('factorsSection').style.display = 'none';
    document.getElementById('activityRecommendations').style.display = 'none';
  }
}

// Display factors section based on selected moods
function displayFactorsSection() {
  const factorsSection = document.getElementById('factorsSection');
  const factorsGrid = document.getElementById('factorsGrid');
  
  factorsSection.style.display = 'block';
  
  // Get unique factors from all selected moods
  const uniqueFactors = new Set();
  selectedMoods.forEach(mood => {
    if (moodFactorOptions[mood]) {
      moodFactorOptions[mood].forEach(factor => uniqueFactors.add(factor));
    }
  });
  
  // Build factors grid
  factorsGrid.innerHTML = '';
  uniqueFactors.forEach(factor => {
    const factorBtn = document.createElement('button');
    factorBtn.className = 'factor-btn';
    factorBtn.textContent = factor;
    factorBtn.onclick = () => toggleFactorSelection(factor, factorBtn);
    factorsGrid.appendChild(factorBtn);
  });
  
  updateSelectedFactorsDisplay();
}

// Toggle factor selection
function toggleFactorSelection(factor, element) {
  if (selectedFactors.includes(factor)) {
    selectedFactors = selectedFactors.filter(f => f !== factor);
    element.classList.remove('selected');
  } else {
    selectedFactors.push(factor);
    element.classList.add('selected');
  }
  updateSelectedFactorsDisplay();
}

// Add custom factor
function addCustomFactor() {
  const customInput = document.getElementById('customFactorInput');
  const customFactor = customInput.value.trim();
  
  if (customFactor && !selectedFactors.includes(customFactor)) {
    selectedFactors.push(customFactor);
    customInput.value = '';
    updateSelectedFactorsDisplay();
  }
}

// Update display of selected factors
function updateSelectedFactorsDisplay() {
  const factorsList = document.getElementById('selectedFactorsList');
  factorsList.innerHTML = '';
  
  if (selectedFactors.length === 0) {
    factorsList.innerHTML = '<span style="color: #999;">None selected yet</span>';
  } else {
    selectedFactors.forEach(factor => {
      const tag = document.createElement('div');
      tag.className = 'factor-tag';
      tag.innerHTML = `${factor} <button onclick="removeFactorTag('${factor}')" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; margin-left: 5px;"> </button>`;
      factorsList.appendChild(tag);
    });
    
    // Show activity recommendations once factors are selected
    setTimeout(() => displayActivityRecommendations(), 300);
  }
}

// Remove factor tag
function removeFactorTag(factor) {
  selectedFactors = selectedFactors.filter(f => f !== factor);
  updateSelectedFactorsDisplay();
}

// ==================== ALGORITHMIC PERSONALIZATION ====================
// Match moods and factors to curated activities

function displayActivityRecommendations() {
  if (selectedMoods.length === 0) return;
  
  const activityRecs = document.getElementById('activityRecommendations');
  const activitiesGrid = document.getElementById('activitiesGrid');
  
  // Get activities based on moods
  let recommendedActivities = [];
  selectedMoods.forEach(mood => {
    if (activityRecommendations[mood]) {
      recommendedActivities = recommendedActivities.concat(activityRecommendations[mood]);
    }
  });
  
  // Remove duplicates by name
  recommendedActivities = recommendedActivities.filter((activity, index, self) =>
    index === self.findIndex(a => a.name === activity.name)
  );
  
  // Shuffle for variety
  recommendedActivities = recommendedActivities.sort(() => 0.5 - Math.random());
  
  // Display top 4-6 recommendations
  activitiesGrid.innerHTML = '';
  recommendedActivities.slice(0, 6).forEach((activity, index) => {
    const activityCard = document.createElement('div');
    activityCard.className = 'activity-card';
    const uniqueId = `materials-${index}`;
    
    // Build materials HTML
    let materialsHTML = '';
    if (activity.materials && activity.materials.length > 0) {
      materialsHTML = `
        <button class="materials-toggle" onclick="toggleMaterials('${uniqueId}')">  View Materials (${activity.materials.length})</button>
        <div id="${uniqueId}" class="materials-section" style="display: none;">
      `;
      activity.materials.forEach(material => {
        if (material.url) {
          materialsHTML += `
            <div class="material-item">
              <span class="material-type">${material.type}</span>
              <a href="${material.url}" target="_blank" class="material-link">${material.title}</a>
            </div>
          `;
        } else {
          materialsHTML += `
            <div class="material-item">
              <span class="material-type">${material.type}</span>
              <div class="material-content">${material.title}</div>
              <p class="material-detail">${material.content}</p>
            </div>
          `;
        }
      });
      materialsHTML += `</div>`;
    }
    
    activityCard.innerHTML = `
      <div class="activity-header">
        <h4>${activity.name}</h4>
        <span class="category-badge">${activity.category}</span>
      </div>
      <p class="activity-benefit">${activity.benefit}</p>
      ${materialsHTML}
      <button class="activity-select-btn" onclick="toggleActivitySelection('${activity.name}', this)">Select</button>
    `;
    activitiesGrid.appendChild(activityCard);
  });
  
  activityRecs.style.display = 'block';
  activityRecs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Toggle materials section visibility
function toggleMaterials(materialsId) {
  const materialsSection = document.getElementById(materialsId);
  if (materialsSection) {
    if (materialsSection.style.display === 'none') {
      materialsSection.style.display = 'block';
    } else {
      materialsSection.style.display = 'none';
    }
  }
}

// Toggle activity selection
function toggleActivitySelection(activityName, button) {
  if (selectedActivities.includes(activityName)) {
    selectedActivities = selectedActivities.filter(a => a !== activityName);
    button.classList.remove('selected');
    button.textContent = 'Select';
  } else {
    selectedActivities.push(activityName);
    button.classList.add('selected');
    button.textContent = '  Selected';
  }
}

// Submit activity selection and save mood data
function submitActivitySelection() {
  // Store mood assessment in localStorage for analytics
  const moodAssessment = {
    timestamp: new Date().toISOString(),
    moods: selectedMoods,
    factors: selectedFactors,
    selectedActivities: selectedActivities
  };
  
  let assessments = JSON.parse(localStorage.getItem('moodAssessments') || '[]');
  assessments.push(moodAssessment);
  localStorage.setItem('moodAssessments', JSON.stringify(assessments));
  
  // Reset and return to main dashboard
  resetMoodAssessment();
  document.getElementById('activityRecommendations').style.display = 'none';
  document.getElementById('factorsSection').style.display = 'none';
  alert('Great! Keep engaging with these activities today. Your preferences have been saved.');
  
  // Redirect to main dashboard area or reset view
  location.reload();
}

// Reset mood assessment
function resetMoodAssessment() {
  selectedMoods = [];
  selectedFactors = [];
  selectedActivities = [];
  
  // Reset UI
  document.querySelectorAll('.mood-card').forEach(card => card.classList.remove('selected'));
  document.querySelectorAll('.factor-btn').forEach(btn => btn.classList.remove('selected'));
}

// Account management functions

// Simple hash function for password storage (basic security)
function hashPassword(password) {
  return btoa(password); // Base64 encoding
}

// Verify password
function verifyPassword(password, hash) {
  return btoa(password) === hash;
}

// Get all accounts from localStorage
function getAllAccounts() {
  let accounts = localStorage.getItem("sluAccounts");
  return accounts ? JSON.parse(accounts) : {};
}

// Save accounts to localStorage
function saveAccounts(accounts) {
  localStorage.setItem("sluAccounts", JSON.stringify(accounts));
}

// Check if account exists
function findAccountKey(rawEmail) {
  const normalized = String(rawEmail || '').trim().toLowerCase();
  const accounts = getAllAccounts();
  if (accounts.hasOwnProperty(normalized)) return normalized;
  const keys = Object.keys(accounts);
  for (let i = 0; i < keys.length; i++) {
    if (keys[i].toLowerCase() === normalized) return keys[i];
  }
  return null;
}

function accountExists(email) {
  return !!findAccountKey(email);
}

// Toggle between login and create account forms
function toggleForm() {
  const loginForm = document.getElementById("loginForm");
  const createForm = document.getElementById("createForm");
  hideAuthMessage();
  
  if (loginForm.style.display === "none") {
    loginForm.style.display = "block";
    createForm.style.display = "none";
    // Clear form fields
    document.getElementById("email").value = "";
    document.getElementById("password").value = "";
  } else {
    loginForm.style.display = "none";
    createForm.style.display = "block";
    // Clear form fields
    document.getElementById("createEmail").value = "";
    document.getElementById("createPassword").value = "";
    document.getElementById("confirmPassword").value = "";
  }
}

function showAuthMessage(message, kind) {
  const el = document.getElementById('authMessage');
  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.hidden = false;
  el.setAttribute('data-kind', kind || 'error');
}

function hideAuthMessage() {
  const el = document.getElementById('authMessage');
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
  el.removeAttribute('data-kind');
}

function isValidSluEmail(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  // Simple, safe check: one @ and ends exactly with @slu.edu.ph
  return /^[^\s@]+@slu\.edu\.ph$/.test(email);
}

// Login function
function login(){
  hideAuthMessage();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value;

  // Validate email format
  if (!email || !password) {
    showAuthMessage("Please enter both email and password", "error");
    return;
  }

  // Check if email is from slu.edu.ph domain
  if (!isValidSluEmail(email)) {
    showAuthMessage("Please enter a valid SLU email (name@slu.edu.ph)", "error");
    return;
  }
  email = email.toLowerCase();

  const accountKey = findAccountKey(email);
  if (!accountKey) {
    showAuthMessage("Account not found. Please create an account first.", "error");
    return;
  }

  // Verify password
  const accounts = getAllAccounts();
  if (verifyPassword(password, accounts[accountKey])) {
    localStorage.setItem("currentUser", email.toLowerCase());
    location.href = "pages/dashboard.html";
  } else {
    showAuthMessage("Incorrect password. Please try again.", "error");
  }
}

// Create account function
function createAccount(){
  hideAuthMessage();
  let email = document.getElementById("createEmail").value.trim();
  let password = document.getElementById("createPassword").value;
  let confirmPassword = document.getElementById("confirmPassword").value;

  // Validate inputs
  if (!email || !password || !confirmPassword) {
    showAuthMessage("Please fill in all fields", "error");
    return;
  }

  // Check if email is from slu.edu.ph domain
  if (!isValidSluEmail(email)) {
    showAuthMessage("Please enter a valid SLU email (name@slu.edu.ph)", "error");
    return;
  }
  email = email.toLowerCase();

  // Check password match
  if (password !== confirmPassword) {
    showAuthMessage("Passwords do not match", "error");
    return;
  }

  // Check password strength (minimum 6 characters)
  if (password.length < 6) {
    showAuthMessage("Password must be at least 6 characters long", "error");
    return;
  }

  // Check if account already exists
  if (accountExists(email)) {
    showAuthMessage("An account with this email already exists", "error");
    return;
  }

  // Create account
  const accounts = getAllAccounts();
  accounts[email] = hashPassword(password);
  saveAccounts(accounts);

  showAuthMessage("Account created successfully! Please log in.", "success");
  
  // Switch back to login form
  toggleForm();
  document.getElementById("email").value = email;
  document.getElementById("password").value = "";
}

// Logout function
function logout(){
  localStorage.removeItem("currentUser");
  location.href = "../index.html";
}

// Display user on dashboard
function displayUser(){
  const userEmail = localStorage.getItem("currentUser");
  const userEmailElement = document.getElementById("userEmail");
  
  if (userEmail) {
    userEmailElement.textContent = "Welcome, " + userEmail;
  } else {
    // Redirect to login if not logged in
    location.href = "../index.html";
  }
}



// multi-mode state
let nextFaceIndex = 0;

function initializeMoodFaces() {
  nextFaceIndex = 0;
  document.querySelectorAll('.face').forEach(face => {
    face.className = 'face neutral';
    face.style.transitionDuration = '0ms';
  });
}

function assignMoodToFace(mood) {
  const faces = document.querySelectorAll('.face');
  if(faces.length === 0) return;
  const face = faces[nextFaceIndex];
  face.style.transitionDuration = '1200ms';
  face.className = 'face ' + mood;
  nextFaceIndex = (nextFaceIndex + 1) % faces.length;
}

// Display mood-specific feedback and recommendations
let moodTipIndex = {};

function displayMoodFeedback(mood) {
  const feedbackDiv = document.getElementById("moodFeedback");
  if (!feedbackDiv) return;

  const moodTips = {
    excited: [
      "Embrace this energy - channel it into something creative or share it with a friend.",
      "Great momentum! Consider planning a small achievement to build on this feeling.",
      "Positive energy detected! Physical activity can amplify this excitement."
    ],
    happy: [
      "Keep up this positive energy! Share your happiness with someone close to you.",
      "Wonderful to see your smile! Consider gratitude journaling to extend this mood.",
      "Happiness boost! Helping someone else can multiply this good feeling."
    ],
    sad: [
      "It's okay to feel sad sometimes. Consider reaching out to someone you trust.",
      "You're not alone - explore our mental health resources or take a gentle walk.",
      "Sadness passes. Try deep breathing and reach out to a friend or hotline."
    ],
    stressed: [
      "Take a deep breath, go for a walk, or try a short mindfulness exercise.",
      "Stress relief: Try box breathing (4-4-4-4) or progressive muscle relaxation.",
      "Check our stress management resources - small steps make a big difference."
    ],
    drained: [
      "Allow yourself a break, hydrate, and do something relaxing.",
      "Self-care time: Try a power nap or gentle restorative yoga.",
      "Recharge: Prioritize sleep hygiene and nourishing foods today."
    ]
  };

  // Mood-specific resource buttons
  const moodResources = {
    sad: { icon: '🚨', label: 'Emergency Hotlines', href: 'hotlines.html' },
    stressed: { icon: '🏥', label: 'Mental Health Resources', href: 'resources.html' },
    drained: { icon: '🚨', label: 'Emergency Hotlines', href: 'hotlines.html' },
    excited: null,
    happy: null
  };

  const resourceBtn = moodResources[mood] ? `
    <div style="margin-top: var(--space-md); display: flex; gap: var(--space-sm); justify-content: center; flex-wrap: wrap;">
      <a href="${moodResources[mood].href}" class="primary-btn nav-btn" style="font-size: 0.85rem; padding: 8px 16px;">
        ${moodResources[mood].icon} ${moodResources[mood].label}
      </a>
    </div>
  ` : '';

  // Initialize index for mood
  if (!moodTipIndex[mood]) moodTipIndex[mood] = 0;

  // Cycle to next tip
  const index = moodTipIndex[mood];
  const tips = moodTips[mood] || moodTips.sad; // fallback
  const tip = tips[index % tips.length];
  moodTipIndex[mood] = (index + 1) % tips.length;

  // Add fade out class first
  feedbackDiv.classList.remove('show', 'fade-in');
  feedbackDiv.style.opacity = '0';

  // Update content after animation
  setTimeout(() => {
    feedbackDiv.innerHTML = `
      <p><strong>${getMoodMessage(mood)}</strong></p>
      <p class="mood-tip">${tip}</p>
      ${resourceBtn}
    `;
    feedbackDiv.classList.add('show');
    feedbackDiv.style.opacity = '1';
  }, 300);
}

function getMoodMessage(mood) {
  const messages = {
    excited: "You must be feeling excited!",
    happy: "Great to see you're happy!",
    sad: "It's okay to feel sad sometimes.",
    stressed: "Stress can weigh you down.",
    drained: "Feeling drained? That's a signal to rest."
  };
  return `  ${messages[mood] || messages.sad}`;
}



function openSite(url){

window.open(url,"_blank","noopener,noreferrer")

}

// initialize face set and listeners when dashboard loads
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => {
    initializeMoodFaces();
    initializeStickyNotes();
    loadMoodStats();
    updateStatisticsDisplay();
    loadRecentMoods(); // Load badges
  });
} else {
  initializeMoodFaces();
  initializeStickyNotes();
  loadMoodStats();
  updateStatisticsDisplay();
  loadRecentMoods(); // Load badges
}

// ========== STICKY NOTES FUNCTIONALITY ==========

// Initialize sticky notes system
function initializeStickyNotes(){
  const input = document.getElementById('moodNote');
  if(!input) return;
  
  // Setup word counter listener
  input.addEventListener('input', updateWordCounter);
  
  // Setup enter key to add note
  input.addEventListener('keypress', (e)=>{
    if(e.key === 'Enter') addMoodNote();
  });
  
  // Load and display saved notes
  loadAndDisplayNotes();
}

// Update word counter
function updateWordCounter(){
  const input = document.getElementById('moodNote');
  const counter = document.getElementById('wordCounter');
  
  if(!input || !counter) return;
  
  const text = input.value.trim();
  const wordCount = text.length === 0 ? 0 : text.split(/\s+/).length;
  
  counter.textContent = `${wordCount} words / 10 max`;
  
  if(wordCount > 10){
    counter.classList.add('warning');
  } else {
    counter.classList.remove('warning');
  }
}

// Add mood note
function addMoodNote(){
  const input = document.getElementById('moodNote');
  if(!input) return;
  
  const text = input.value.trim();
  
  if(!text){
    alert('Please enter a note');
    return;
  }
  
  // Count words
  const wordCount = text.split(/\s+/).length;
  
  if(wordCount > 10){
    alert('Please keep your note to 10 words or less');
    return;
  }
  
  // Get existing notes
  let notes = JSON.parse(localStorage.getItem('moodNotes') || '[]');
  
  // Add new note with timestamp
  notes.push({
    text: text,
    timestamp: Date.now()
  });
  
  // Save to localStorage
  localStorage.setItem('moodNotes', JSON.stringify(notes));
  
  // Clear input
  input.value = '';
  updateWordCounter();
  
  // Reload display
  loadAndDisplayNotes();
}

// Clear all notes
function clearAllNotes(){
  if(confirm('Are you sure you want to clear all your sticky notes?')){
    localStorage.removeItem('moodNotes');
    loadAndDisplayNotes();
  }
}

// Load and display notes as sticky notes
function loadAndDisplayNotes(){
  const board = document.getElementById('stickyNotesBoard');
  if(!board) return;
  
  let notes = JSON.parse(localStorage.getItem('moodNotes') || '[]');
  
  // Clear board
  board.innerHTML = '';
  
  if(notes.length === 0){
    board.innerHTML = '<div class="sticky-note-empty">  Your thoughts will appear as sticky notes</div>';
    return;
  }
  
  // Display each note as a sticky note
  notes.forEach((note, index) => {
    const sticky = document.createElement('div');
    sticky.className = 'sticky-note';
    sticky.innerHTML = `<p>${escapeHtml(note.text)}</p>`;
    board.appendChild(sticky);
  });
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(text){
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}



// Initialize Lucide icons
if (typeof lucide !== undefined) {
  lucide.createIcons();
}
