// Substack AI Transparency Tracker - Google Docs Style Comment System
// Version 1.0.0 - Sidebar-based AI tracking without DOM modification

class AITracker {
  constructor() {
    this.currentPost = null;
    this.currentPostId = null;
    this.annotations = [];
    this.isSubstackEditor = false;
    this.sidebar = null;
    this.isSelectionMode = false;
    this.currentSelection = null;
    this.init();
  }

  init() {
    console.log("AITracker init called");
    this.detectSubstackEditor();
    console.log(
      "After detectSubstackEditor, isSubstackEditor:",
      this.isSubstackEditor
    );
    if (this.isSubstackEditor) {
      console.log("Setting up AI Tracker...");
      this.currentPostId = this.extractPostId();
      console.log("Extracted post ID:", this.currentPostId);
      this.setupEventListeners();
      this.createSidebar();
      this.injectSidebarStyles();
      this.loadAnnotations(); // Load after sidebar is created
      console.log("AI Tracker setup complete");
    } else {
      console.log("Not a Substack editor, skipping setup");
    }
  }

  detectSubstackEditor() {
    console.log("detectSubstackEditor called");
    console.log("Current URL:", window.location.href);

    const editorSelectors = [
      '[data-testid="editor"]',
      ".editor",
      '[contenteditable="true"]',
      'textarea[name="body"]',
    ];

    for (const selector of editorSelectors) {
      if (document.querySelector(selector)) {
        console.log("Found editor element with selector:", selector);
        this.isSubstackEditor = true;
        break;
      }
    }

    if (
      window.location.href.includes("substack.com") &&
      (window.location.href.includes("/p/") ||
        window.location.href.includes("/edit"))
    ) {
      console.log("Detected Substack editor URL");
      this.isSubstackEditor = true;
    }

    // Also enable for local test files
    if (
      window.location.protocol === "file:" &&
      window.location.href.includes("test-comment-system.html")
    ) {
      console.log("Detected test file");
      this.isSubstackEditor = true;
    }

    console.log("isSubstackEditor:", this.isSubstackEditor);
  }

  extractPostId() {
    const url = window.location.href;
    console.log("Extracting post ID from URL:", url);
    
    // For Substack URLs like:
    // https://username.substack.com/p/post-title
    // https://username.substack.com/p/post-title/edit
    // https://username.substack.com/publish/post/123456
    
    // Try to extract from /p/ URLs
    let match = url.match(/\/p\/([^\/\?#]+)/);
    if (match) {
      const postSlug = match[1];
      console.log("✅ Extracted post slug:", postSlug);
      return postSlug;
    }
    
    // Try to extract from /publish/post/ URLs (draft editing)
    match = url.match(/\/publish\/post\/(\d+)/);
    if (match) {
      const postId = match[1];
      console.log("✅ Extracted post ID from draft:", postId);
      return postId;
    }
    
    // For test files, use the filename
    if (url.includes("test-comment-system.html")) {
      console.log("✅ Using test post ID");
      return "test-post";
    }
    
    // Fallback: use a hash of the URL
    const fallbackId = this.hashCode(url);
    console.log("⚠️ Using fallback post ID:", fallbackId, "for URL:", url);
    return fallbackId.toString();
  }

  hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  injectSidebarStyles() {
    const styleId = "ai-tracker-sidebar-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #ai-tracker-sidebar {
        position: fixed;
        top: 0;
        right: 0;
        width: 360px;
        height: 100vh;
        background: #ffffff;
        border-left: 1px solid #e4e4e7;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: -10px 0 25px -5px rgba(0, 0, 0, 0.1), -4px 0 10px -6px rgba(0, 0, 0, 0.1);
      }
      
      #ai-tracker-sidebar.open {
        transform: translateX(0);
      }
      
      .ai-sidebar-header {
        padding: 24px;
        background: #ffffff;
        border-bottom: 1px solid #e4e4e7;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .ai-sidebar-title {
        font-size: 18px;
        font-weight: 600;
        color: #09090b;
        margin: 0;
        letter-spacing: -0.025em;
      }
      
      .ai-sidebar-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #71717a;
        padding: 8px;
        border-radius: 6px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
      }
      
      .ai-sidebar-close:hover {
        background: #f4f4f5;
        color: #09090b;
      }
      
      .ai-sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
        background: #fafafa;
      }
      
      .ai-sidebar-stats {
        background: #ffffff;
        border: 1px solid #e4e4e7;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 24px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
      }
      
      .ai-sidebar-stats h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #09090b;
        letter-spacing: -0.025em;
      }
      
      .ai-stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 14px;
        color: #52525b;
      }
      
      .ai-stat-item:last-child {
        margin-bottom: 0;
      }
      
      .ai-stat-item span:last-child {
        font-weight: 600;
        color: #09090b;
      }
      
      .ai-annotation-list {
        margin-top: 24px;
      }
      
      .ai-annotation-list h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #09090b;
        letter-spacing: -0.025em;
      }
      
      .ai-annotation-item {
        background: #ffffff;
        border: 1px solid #e4e4e7;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        position: relative;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      }
      
      .ai-annotation-item:hover {
        border-color: #d4d4d8;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      }
      
      .ai-annotation-item.ai-assisted {
        /* Removed black border */
      }
      
      .ai-annotation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .ai-annotation-type {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: #09090b;
        background: #f4f4f5;
        padding: 4px 8px;
        border-radius: 6px;
        letter-spacing: 0.05em;
      }
      
      .ai-annotation-delete {
        background: none;
        border: none;
        color: #71717a;
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }
      
      .ai-annotation-delete:hover {
        color: #dc2626;
        background: #fef2f2;
      }
      
      .ai-annotation-text {
        font-size: 14px;
        line-height: 1.5;
        color: #52525b;
        background: #f9f9f9;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #09090b;
        margin-bottom: 12px;
      }
      
      .ai-annotation-clickable {
        cursor: pointer;
        transition: all 0.2s ease;
      }
      
      .ai-annotation-clickable:hover {
        background: #f4f4f5;
        border-left-color: #52525b;
      }
      
      .ai-annotation-meta {
        font-size: 12px;
        color: #71717a;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .ai-selection-prompt {
        background: #ffffff;
        border: 1px solid #e4e4e7;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin-bottom: 24px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
      }
      
      .ai-selection-prompt h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #09090b;
        letter-spacing: -0.025em;
      }
      
      .ai-selection-preview {
        margin-bottom: 20px;
        text-align: left;
      }
      
      .ai-selection-preview p {
        margin: 0 0 12px 0;
        font-size: 14px;
        color: #52525b;
        line-height: 1.5;
        background: #f9f9f9;
        padding: 12px;
        border-radius: 8px;
        border-left: 3px solid #e4e4e7;
      }
      
      .ai-word-count-badge {
        display: inline-flex;
        align-items: center;
        background: #f4f4f5;
        color: #71717a;
        font-size: 12px;
        font-weight: 500;
        padding: 4px 8px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .ai-selection-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      
      .ai-btn {
        padding: 10px 20px;
        border: 1px solid transparent;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
      }
      
      .ai-btn-primary {
        background: #09090b;
        color: #ffffff;
        border-color: #09090b;
      }
      
      .ai-btn-primary:hover {
        background: #18181b;
        border-color: #18181b;
      }
      
      .ai-btn-secondary {
        background: #ffffff;
        color: #09090b;
        border-color: #e4e4e7;
      }
      
      .ai-btn-secondary:hover {
        background: #f4f4f5;
        border-color: #d4d4d8;
      }
      
      .ai-toggle-btn {
        position: fixed;
        top: 120px;
        right: 20px;
        background: #D4F0F2;
        color: white;
        border: none;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .ai-toggle-btn:hover {
        background: #1A5F6E;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      }
      
      .ai-toggle-btn.sidebar-open {
        right: 380px;
      }
      
      .ai-empty-state {
        text-align: center;
        color: #71717a;
        padding: 40px 20px;
        background: #ffffff;
        border: 1px solid #e4e4e7;
        border-radius: 12px;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
      }
      
      .ai-empty-state p {
        margin: 8px 0;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .ai-word-count {
        font-size: 32px;
        font-weight: 700;
        color: #09090b;
        text-align: center;
        margin: 16px 0 8px 0;
        letter-spacing: -0.025em;
      }
    `;
    document.head.appendChild(style);
  }

  createSidebar() {
    // Create toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "ai-tracker-toggle";
    toggleBtn.className = "ai-toggle-btn";

    // Use robot emoji
    const robotEmoji = document.createElement("span");
    robotEmoji.textContent = "🤖";
    robotEmoji.style.fontSize = "28px";
    robotEmoji.style.lineHeight = "1";

    toggleBtn.appendChild(robotEmoji);
    toggleBtn.title = "AI Transparency Tracker";
    document.body.appendChild(toggleBtn);

    // Create sidebar
    const sidebar = document.createElement("div");
    sidebar.id = "ai-tracker-sidebar";
    sidebar.innerHTML = `
      <div class="ai-sidebar-header">
        <h2 class="ai-sidebar-title">AI Assistance Tracker</h2>
        <button class="ai-sidebar-close">×</button>
      </div>
      <div class="ai-sidebar-content">
        <div class="ai-sidebar-stats">
          <h3>Content Statistics</h3>
          <div class="ai-stat-item">
            <span>Total Words:</span>
            <span id="ai-total-words">0</span>
          </div>
          <div class="ai-stat-item">
            <span>AI Words:</span>
            <span id="ai-ai-words">0</span>
          </div>
          <div class="ai-word-count" id="ai-percentage">0%</div>
          <div style="font-size: 11px; color: #666; text-align: center; margin-top: 4px;">AI Content</div>
        </div>
        
        <div id="ai-selection-area"></div>
        
        <div class="ai-annotation-list">
          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #333;">AI Annotations</h3>
          <div id="ai-annotations-container"></div>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);

    this.sidebar = sidebar;
    this.setupSidebarEvents();
  }

  setupSidebarEvents() {
    const toggleBtn = document.getElementById("ai-tracker-toggle");
    const closeBtn = this.sidebar.querySelector(".ai-sidebar-close");

    toggleBtn.addEventListener("click", () => {
      this.toggleSidebar();
    });

    closeBtn.addEventListener("click", () => {
      this.closeSidebar();
    });
  }

  toggleSidebar() {
    const sidebar = document.getElementById("ai-tracker-sidebar");
    const toggleBtn = document.getElementById("ai-tracker-toggle");

    if (sidebar.classList.contains("open")) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    const sidebar = document.getElementById("ai-tracker-sidebar");
    const toggleBtn = document.getElementById("ai-tracker-toggle");

    sidebar.classList.add("open");
    toggleBtn.classList.add("sidebar-open");

    this.updateSidebarContent();
  }

  closeSidebar() {
    const sidebar = document.getElementById("ai-tracker-sidebar");
    const toggleBtn = document.getElementById("ai-tracker-toggle");

    sidebar.classList.remove("open");
    toggleBtn.classList.remove("sidebar-open");
  }

  setupEventListeners() {
    // Listen for text selection
    document.addEventListener(
      "selectionchange",
      this.handleSelectionChange.bind(this)
    );

    this.observeContentChanges();

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "cleanup") {
        this.cleanupStaleAnnotations();
        this.saveAnnotations();
        this.updateStats();
        sendResponse({ success: true });
      }
    });
  }

  handleSelectionChange() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log("Selection changed:", selectedText);

    if (selectedText.length > 0) {
      // Check if the selection is within the sidebar - if so, ignore it
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
        const sidebar = document.getElementById("ai-tracker-sidebar");

        // Check if the selection is within the sidebar or toggle button
        if (
          sidebar &&
          (sidebar.contains(commonAncestor) || commonAncestor === sidebar)
        ) {
          console.log("Selection is within sidebar, ignoring");
          return;
        }

        // Also check if selection is within the toggle button
        const toggleBtn = document.getElementById("ai-tracker-toggle");
        if (
          toggleBtn &&
          (toggleBtn.contains(commonAncestor) || commonAncestor === toggleBtn)
        ) {
          console.log("Selection is within toggle button, ignoring");
          return;
        }
      }

      this.currentSelection = {
        text: selectedText,
        range:
          selection.rangeCount > 0
            ? selection.getRangeAt(0).cloneRange()
            : null,
      };
      console.log("Set currentSelection:", this.currentSelection);
      this.showSelectionPrompt();
    } else {
      this.currentSelection = null;
      console.log("Cleared currentSelection");
      this.hideSelectionPrompt();
    }
  }

  showSelectionPrompt() {
    if (!this.currentSelection) return;

    const selectionArea = document.getElementById("ai-selection-area");
    const text = this.currentSelection.text;
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

    selectionArea.innerHTML = `
      <div class="ai-selection-prompt">
        <h3>Text Selected</h3>
        <div class="ai-selection-preview">
          <p>"${text.substring(0, 80)}${text.length > 80 ? "..." : ""}"</p>
          <span class="ai-word-count-badge">${wordCount} ${
      wordCount === 1 ? "word" : "words"
    }</span>
        </div>
        <div class="ai-selection-buttons">
          <button class="ai-btn ai-btn-primary" id="mark-as-ai-btn">Mark as AI</button>
          <button class="ai-btn ai-btn-secondary" id="mark-as-human-btn">Mark as Human</button>
        </div>
      </div>
    `;

    // Add event listeners to the buttons
    const markAsAIBtn = document.getElementById("mark-as-ai-btn");
    const markAsHumanBtn = document.getElementById("mark-as-human-btn");

    if (markAsAIBtn) {
      markAsAIBtn.addEventListener("click", () => {
        console.log("Mark as AI button clicked");
        this.markAsAI();
      });
    }

    if (markAsHumanBtn) {
      markAsHumanBtn.addEventListener("click", () => {
        console.log("Mark as Human button clicked");
        this.markAsHuman();
      });
    }


  }

  hideSelectionPrompt() {
    const selectionArea = document.getElementById("ai-selection-area");
    selectionArea.innerHTML = "";
  }

  markAsAI() {
    console.log("markAsAI called");
    console.log("currentSelection:", this.currentSelection);
    if (this.currentSelection) {
      console.log("Adding annotation for text:", this.currentSelection.text);
      this.addAnnotation(this.currentSelection.text, "ai-assisted");
      this.clearSelection();
    } else {
      console.log("No current selection available");
    }
  }

  markAsHuman() {
    if (this.currentSelection) {
      this.removeAnnotationForText(this.currentSelection.text);
      this.clearSelection();
    }
  }

  clearSelection() {
    window.getSelection().removeAllRanges();
    this.currentSelection = null;
    this.hideSelectionPrompt();
  }

  addAnnotation(text, type) {
    console.log("addAnnotation called with:", text, type);

    // Normalize whitespace consistently - convert line breaks and multiple spaces to single spaces
    const normalizedText = text.replace(/\s+/g, " ").trim();

    const annotation = {
      id: this.generateId(),
      text: normalizedText,
      type,
      timestamp: new Date().toISOString(),
      wordCount: normalizedText.split(/\s+/).filter((w) => w.length > 0).length,
    };

    console.log("Created annotation with normalized text:", annotation);
    this.annotations.push(annotation);
    console.log("Total annotations now:", this.annotations.length);
    this.saveAnnotations();
    this.updateSidebarContent();
    this.updateStats();
  }

  generateId() {
    return (
      "annotation_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  updateSidebarContent(skipCleanup = false) {
    this.updateStats(skipCleanup);
    this.updateAnnotationsList();
  }

  updateAnnotationsList() {
    const container = document.getElementById("ai-annotations-container");
    console.log("updateAnnotationsList called, container:", container);
    console.log("annotations array:", this.annotations);
    if (!container) return;

    if (this.annotations.length === 0) {
      container.innerHTML = `
        <div class="ai-empty-state">
          <p><strong>No AI annotations yet.</strong></p>
          <p>Select text and mark it as AI-assisted to get started</p>
        </div>
      `;
      return;
    }

    const aiAnnotations = this.annotations.filter(
      (a) => a.type === "ai-assisted"
    );
    console.log("AI annotations to display:", aiAnnotations);

    container.innerHTML = aiAnnotations
      .map(
        (annotation) => `
      <div class="ai-annotation-item ${annotation.type}" data-annotation-id="${
          annotation.id
        }">
        <div class="ai-annotation-header">
          <span class="ai-annotation-type">🤖 AI Assisted</span>
          <button class="ai-annotation-delete" data-annotation-id="${
            annotation.id
          }" title="Remove annotation">×</button>
        </div>
        <div class="ai-annotation-text ai-annotation-clickable" data-annotation-id="${
          annotation.id
        }" title="Click to find in document">"${annotation.text.substring(
          0,
          100
        )}${annotation.text.length > 100 ? "..." : ""}"</div>
        <div class="ai-annotation-meta">
          <span>${annotation.wordCount} words</span>
        </div>
      </div>
    `
      )
      .join("");

    // Add event listeners to delete buttons
    const deleteButtons = container.querySelectorAll(".ai-annotation-delete");
    deleteButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation(); // Prevent triggering the annotation click
        const annotationId = e.target.getAttribute("data-annotation-id");
        console.log("Delete button clicked for annotation:", annotationId);
        this.removeAnnotationById(annotationId);
      });
    });

    // Add event listeners to annotation text for scrolling to location
    const annotationTexts = container.querySelectorAll(
      ".ai-annotation-clickable"
    );
    annotationTexts.forEach((textElement) => {
      textElement.addEventListener("click", (e) => {
        const annotationId = e.target.getAttribute("data-annotation-id");
        console.log("Annotation text clicked for annotation:", annotationId);
        this.scrollToAnnotation(annotationId);
      });
    });

    console.log("Updated container HTML");
  }

  scrollToAnnotation(annotationId) {
    const annotation = this.annotations.find((a) => a.id === annotationId);
    if (!annotation) {
      console.log("Annotation not found:", annotationId);
      return;
    }

    console.log("Scrolling to annotation:", annotation.text.substring(0, 50));

    // Find the text in the document
    const found = this.findTextInDocument(annotation.text);
    if (found) {
      // Scroll to the found text
      found.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      // Temporarily highlight the text
      this.highlightText(
        found.element,
        found.startOffset,
        found.endOffset,
        annotation.text
      );
    } else {
      console.log(
        "Text not found in document:",
        annotation.text.substring(0, 50)
      );
      // Show a message to the user
      this.showNotification(
        "Text not found in document. It may have been edited or moved."
      );
    }
  }

  findTextInDocument(searchText) {
    // Get all text nodes in the document (excluding sidebar)
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          // Skip nodes inside the sidebar
          if (
            node.parentElement &&
            node.parentElement.closest("#ai-tracker-sidebar")
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim().length > 0) {
        textNodes.push(node);
      }
    }

    // Search for the text across text nodes
    const normalizedSearch = searchText.replace(/\s+/g, " ").trim();

    for (let i = 0; i < textNodes.length; i++) {
      const textNode = textNodes[i];
      const nodeText = textNode.textContent;
      const normalizedNodeText = nodeText.replace(/\s+/g, " ");

      // Check if the search text is contained in this node
      const index = normalizedNodeText.indexOf(normalizedSearch);
      if (index !== -1) {
        return {
          element: textNode.parentElement,
          textNode: textNode,
          startOffset: index,
          endOffset: index + normalizedSearch.length,
        };
      }
    }

    // If not found in a single node, try to find across multiple nodes
    // This is more complex but handles text that spans elements
    let combinedText = "";
    let nodeMap = [];

    for (let i = 0; i < textNodes.length; i++) {
      const nodeText = textNodes[i].textContent.replace(/\s+/g, " ");
      nodeMap.push({
        node: textNodes[i],
        start: combinedText.length,
        end: combinedText.length + nodeText.length,
      });
      combinedText += nodeText;
    }

    const combinedIndex = combinedText.indexOf(normalizedSearch);
    if (combinedIndex !== -1) {
      // Find which node contains the start of our text
      for (let i = 0; i < nodeMap.length; i++) {
        if (
          combinedIndex >= nodeMap[i].start &&
          combinedIndex < nodeMap[i].end
        ) {
          return {
            element: nodeMap[i].node.parentElement,
            textNode: nodeMap[i].node,
            startOffset: combinedIndex - nodeMap[i].start,
            endOffset: Math.min(
              combinedIndex + normalizedSearch.length - nodeMap[i].start,
              nodeMap[i].node.textContent.length
            ),
          };
        }
      }
    }

    return null;
  }

  highlightText(element, startOffset, endOffset, originalText) {
    // Create a temporary highlight effect
    const originalBg = element.style.backgroundColor;
    const originalTransition = element.style.transition;

    // Apply highlight
    element.style.transition = "background-color 0.3s ease";
    element.style.backgroundColor = "#ffeb3b";

    // Show a tooltip with the annotation info
    this.showNotification(
      `Found: "${originalText.substring(0, 50)}${
        originalText.length > 50 ? "..." : ""
      }"`
    );

    // Remove highlight after 3 seconds
    setTimeout(() => {
      element.style.backgroundColor = originalBg;
      setTimeout(() => {
        element.style.transition = originalTransition;
      }, 300);
    }, 3000);
  }

  showNotification(message) {
    // Create a temporary notification
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #333;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10001;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  removeAnnotationById(id) {
    this.annotations = this.annotations.filter((a) => a.id !== id);
    this.saveAnnotations();
    this.updateSidebarContent();
  }

  removeAnnotationForText(text) {
    const textToRemove = text.trim();
    this.annotations = this.annotations.filter((annotation) => {
      return !(
        annotation.text === textToRemove ||
        annotation.text.includes(textToRemove) ||
        textToRemove.includes(annotation.text)
      );
    });
    this.saveAnnotations();
    this.updateSidebarContent();
  }

  updateStats(skipCleanup = false) {
    const totalWords = this.countWords();
    const aiWords = this.countAIWords(skipCleanup);
    const percentage =
      totalWords > 0 ? Math.round((aiWords / totalWords) * 100) : 0;

    console.log(
      "updateStats called - totalWords:",
      totalWords,
      "aiWords:",
      aiWords,
      "percentage:",
      percentage
    );

    const stats = { totalWords, aiWords, aiPercentage: percentage };

    // Update sidebar stats
    const totalWordsEl = document.getElementById("ai-total-words");
    const aiWordsEl = document.getElementById("ai-ai-words");
    const percentageEl = document.getElementById("ai-percentage");

    console.log("Updating DOM elements:", {
      totalWordsEl,
      aiWordsEl,
      percentageEl,
    });

    if (totalWordsEl) {
      totalWordsEl.textContent = totalWords;
      console.log("Updated total words to:", totalWords);
    }
    if (aiWordsEl) {
      aiWordsEl.textContent = aiWords;
      console.log("Updated AI words to:", aiWords);
    }
    if (percentageEl) {
      percentageEl.textContent = percentage + "%";
      console.log("Updated percentage to:", percentage + "%");
    }

    // Store stats
    chrome.storage.local.set({ currentStats: stats }, () => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
      }
    });
  }

  countWords() {
    // Simple and accurate: only count words in contenteditable elements
    // This is where users are actually writing their content
    
    let totalText = '';
    
    // Find all contenteditable elements (where users write)
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    
    for (const element of editableElements) {
      // Skip our sidebar and toggle button
      if (element.closest('#ai-tracker-sidebar') || element.id === 'ai-tracker-toggle') {
        continue;
      }
      
      // Get the text content
      const elementText = element.textContent || element.innerText || '';
      if (elementText.trim().length > 0) {
        totalText += elementText + ' ';
      }
    }
    
    // Clean and count words
    const cleanText = totalText.trim();
    const wordCount = cleanText.length > 0 
      ? cleanText.split(/\s+/).filter(word => word.length > 0).length 
      : 0;
    
    console.log(
      "countWords - contenteditable text length:",
      cleanText.length,
      "word count:",
      wordCount,
      "sample:",
      cleanText.substring(0, 100) + "..."
    );

    return wordCount;
  }

  countAIWords(skipCleanup = false) {
    console.log(
      "countAIWords called, annotations before cleanup:",
      this.annotations.length,
      "skipCleanup:",
      skipCleanup
    );
    
    // Only cleanup if explicitly requested, not on every stats update
    if (!skipCleanup) {
      this.cleanupStaleAnnotations();
      console.log(
        "countAIWords called, annotations after cleanup:",
        this.annotations.length
      );
    }

    let aiWordCount = 0;
    this.annotations.forEach((annotation) => {
      if (annotation.type === "ai-assisted") {
        console.log(
          "Adding AI words for annotation:",
          annotation.text.substring(0, 50),
          "wordCount:",
          annotation.wordCount
        );
        aiWordCount += annotation.wordCount || 0;
      }
    });
    console.log("Total AI word count:", aiWordCount);
    return aiWordCount;
  }

  cleanupStaleAnnotations() {
    const documentText = document.body.textContent || "";
    console.log(
      "cleanupStaleAnnotations called, document text length:",
      documentText.length
    );
    console.log(
      "Annotations before cleanup:",
      this.annotations.map((a) => ({
        text: a.text.substring(0, 50),
        type: a.type,
      }))
    );

    // Get text content excluding the sidebar
    const sidebar = document.getElementById("ai-tracker-sidebar");
    let contentText = documentText;
    if (sidebar) {
      const sidebarText = sidebar.textContent || "";
      contentText = documentText.replace(sidebarText, "");
    }

    this.annotations = this.annotations.filter((annotation) => {
      // Normalize whitespace for comparison
      const normalizedAnnotation = annotation.text.replace(/\s+/g, " ").trim();
      const normalizedContent = contentText.replace(/\s+/g, " ").trim();

      // Check if the annotation text exists in the document (with normalized whitespace)
      const found = normalizedContent.includes(normalizedAnnotation);

      if (!found) {
        console.log(
          "Removing stale annotation:",
          annotation.text.substring(0, 50)
        );
      } else {
        console.log("Keeping annotation:", annotation.text.substring(0, 50));
      }
      return found;
    });

    console.log(
      "Annotations after cleanup:",
      this.annotations.map((a) => ({
        text: a.text.substring(0, 50),
        type: a.type,
      }))
    );
  }

  observeContentChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      mutations.forEach((mutation) => {
        // Ignore mutations in the AI tracker sidebar and its children
        if (
          mutation.target.id === "ai-tracker-sidebar" ||
          mutation.target.closest("#ai-tracker-sidebar") ||
          mutation.target.id === "ai-tracker-toggle" ||
          mutation.target.classList?.contains("ai-tracker-sidebar-styles")
        ) {
          return;
        }

        if (
          mutation.type === "childList" ||
          mutation.type === "characterData"
        ) {
          console.log("Content change detected, will update stats and save annotations");
          shouldUpdate = true;
        }
      });

      if (shouldUpdate) {
        clearTimeout(this.updateTimeout);
        this.updateTimeout = setTimeout(() => {
          console.log("Updating stats and saving annotations due to content change");
          this.cleanupStaleAnnotations();
          this.saveAnnotations();
          this.updateStats();
        }, 500);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  saveAnnotations() {
    if (!this.currentPostId) {
      console.warn("No post ID available, cannot save annotations");
      return;
    }

    const storageKey = `ai-tracker-post-${this.currentPostId}`;
    const data = {
      postId: this.currentPostId,
      url: window.location.href,
      annotations: this.annotations,
      lastUpdated: new Date().toISOString(),
    };
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log(`Saved ${this.annotations.length} annotations for post ${this.currentPostId}`);
    } catch (error) {
      console.error("Failed to save annotations to localStorage:", error);
      // Fallback to Chrome storage if localStorage fails
      chrome.storage.local.set({ [storageKey]: data });
    }
  }

  loadAnnotations() {
    if (!this.currentPostId) {
      console.warn("No post ID available, cannot load annotations");
      this.annotations = [];
      this.updateSidebarContent();
      return;
    }

    const storageKey = `ai-tracker-post-${this.currentPostId}`;
    console.log("🔍 Loading annotations with storage key:", storageKey);
    
    // Debug: Show all localStorage keys that match our pattern
    console.log("🗂️ All AI tracker keys in localStorage:");
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ai-tracker-post-')) {
        console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
      }
    }
    
    try {
      const storedData = localStorage.getItem(storageKey);
      console.log("📦 Raw stored data:", storedData);
      
      if (storedData) {
        const data = JSON.parse(storedData);
        this.annotations = data.annotations || [];
        console.log(`✅ Loaded ${this.annotations.length} annotations for post ${this.currentPostId}:`);
        this.annotations.forEach((ann, i) => {
          console.log(`  ${i + 1}. "${ann.text.substring(0, 50)}..." (${ann.wordCount} words)`);
        });
      } else {
        console.log(`❌ No stored annotations found for post ${this.currentPostId}`);
        this.annotations = [];
      }
    } catch (error) {
      console.error("💥 Failed to load annotations from localStorage:", error);
      // Fallback to Chrome storage if localStorage fails
      chrome.storage.local.get([storageKey], (result) => {
        if (result[storageKey]) {
          this.annotations = result[storageKey].annotations || [];
          console.log(`🔄 Loaded ${this.annotations.length} annotations from Chrome storage for post ${this.currentPostId}`);
        } else {
          this.annotations = [];
        }
        this.updateSidebarContent();
      });
      return;
    }
    
    console.log("🎯 About to call updateSidebarContent with", this.annotations.length, "annotations");
    this.updateSidebarContent(true); // Skip cleanup on initial load
    
    // Force stats update after a short delay to ensure DOM is ready, skip cleanup on initial load
    setTimeout(() => {
      console.log("🔄 Force updating stats after load (skipping cleanup)");
      this.updateStats(true); // Skip cleanup on initial load
    }, 100);
  }
}

// Initialize the tracker and make it globally accessible
let aiTracker;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    aiTracker = new AITracker();
    window.aiTracker = aiTracker; // Make globally accessible for button clicks
  });
} else {
  aiTracker = new AITracker();
  window.aiTracker = aiTracker;
}
