// Substack AI Transparency Tracker - Popup Script

class PopupManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadStats();
    this.setupEventListeners();
  }

  loadStats() {
    // First, trigger cleanup in the content script
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'cleanup'}, () => {
          // Ignore errors if content script isn't loaded
          if (chrome.runtime.lastError) {
            console.log('Content script not available:', chrome.runtime.lastError.message);
          }
        });
      }
    });

    // Load stats after a brief delay to allow cleanup
    setTimeout(() => {
      chrome.storage.local.get(['currentStats', 'currentPost'], (result) => {
        if (result.currentStats) {
          this.displayStats(result.currentStats);
          this.generateReport(result.currentStats);
        } else {
          this.showNoData();
        }
      });
    }, 100);
  }

  displayStats(stats) {
    document.getElementById('total-words').textContent = stats.totalWords || 0;
    document.getElementById('ai-words').textContent = stats.aiWords || 0;
    document.getElementById('human-words').textContent = (stats.totalWords || 0) - (stats.aiWords || 0);
    document.getElementById('percentage').textContent = `${stats.aiPercentage || 0}%`;

    // Show/hide appropriate elements
    document.getElementById('stats-container').style.display = 'block';
    document.getElementById('no-data').style.display = 'none';
    
    if (stats.aiWords > 0) {
      document.getElementById('copy-report').style.display = 'block';
      document.getElementById('report-container').style.display = 'block';
    } else {
      document.getElementById('copy-report').style.display = 'none';
      document.getElementById('report-container').style.display = 'none';
    }
  }

  generateReport(stats) {
    if (stats.aiWords === 0) {
      document.getElementById('report-text').textContent = 'This post was written entirely by human effort.';
      return;
    }
    const percentage = stats.aiPercentage;
    document.getElementById('report-text').textContent = `${percentage}% of this post was written or modified with AI assistance.`;
  }

  showNoData() {
    document.getElementById('stats-container').style.display = 'none';
    document.getElementById('percentage').style.display = 'none';
    document.getElementById('copy-report').style.display = 'none';
    document.getElementById('report-container').style.display = 'none';
    document.getElementById('no-data').style.display = 'block';
  }

  setupEventListeners() {
    // Copy report button
    document.getElementById('copy-report').addEventListener('click', () => {
      this.copyReport();
    });

    // Clear data button
    document.getElementById('clear-data').addEventListener('click', () => {
      this.clearData();
    });
  }

  copyReport() {
    const reportText = document.getElementById('report-text').textContent;
    
    if (reportText) {
      navigator.clipboard.writeText(reportText).then(() => {
        // Show success feedback
        const button = document.getElementById('copy-report');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#4caf50';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '#1976d2';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback for older browsers
        this.fallbackCopy(reportText);
      });
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      const button = document.getElementById('copy-report');
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.style.background = '#4caf50';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#1976d2';
      }, 2000);
    } catch (err) {
      console.error('Fallback copy failed: ', err);
    }
    
    document.body.removeChild(textArea);
  }

  clearData() {
    if (confirm('Are you sure you want to clear all annotation data? This cannot be undone.')) {
      chrome.storage.local.clear(() => {
        this.showNoData();
        
        // Show success feedback
        const button = document.getElementById('clear-data');
        const originalText = button.textContent;
        button.textContent = 'Cleared!';
        button.style.background = '#4caf50';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '#f5f5f5';
        }, 2000);
      });
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
}); 