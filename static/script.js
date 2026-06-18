document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    
    const previewArea = document.getElementById('previewArea');
    const imagePreview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeBtn');
    const predictBtn = document.getElementById('predictBtn');
    
    const loadingArea = document.getElementById('loadingArea');
    const resultArea = document.getElementById('resultArea');
    const resetBtn = document.getElementById('resetBtn');
    
    const diseaseName = document.getElementById('diseaseName');
    const confidenceFill = document.getElementById('confidenceFill');
    const confidenceValue = document.getElementById('confidenceValue');

    // SE Testing Metrics from Module 4
    const failureRates = {
        'none': 0.0,
        'flip': 1.0,
        'darken': 3.5,
        'rotate': 1.0,
        'pitch_black': 93.5,
        'blinding_light': 55.0,
        'rotate_359': 0.0
    };

    const mutationRadios = document.querySelectorAll('input[name="mutation"]');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const brightnessVal = document.getElementById('brightnessVal');
    const rotationSlider = document.getElementById('rotationSlider');
    const rotationVal = document.getElementById('rotationVal');
    const flipCheckbox = document.getElementById('flipCheckbox');
    const failureRateDisplay = document.getElementById('failureRateDisplay');

    let currentFile = null;
    let originalDataUrl = null;

    // --- SE Controls Handler ---
    
    // 1. Handle Preset Radio Buttons
    mutationRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const mutation = e.target.value;
            
            // Set slider values based on preset
            if (mutation === 'none') {
                setManualControls(1.0, 0, false);
            } else if (mutation === 'flip') {
                setManualControls(1.0, 0, true);
            } else if (mutation === 'darken') {
                setManualControls(0.5, 0, false);
            } else if (mutation === 'rotate') {
                setManualControls(1.0, 25, false);
            } else if (mutation === 'pitch_black') {
                setManualControls(0.01, 0, false);
            } else if (mutation === 'blinding_light') {
                setManualControls(2.5, 0, false);
            } else if (mutation === 'rotate_359') {
                setManualControls(1.0, 359, false);
            }

            const rate = failureRates[mutation];
            updateFailureUI(rate);
        });
    });

    function setManualControls(b, r, f) {
        brightnessSlider.value = b;
        brightnessVal.textContent = b;
        rotationSlider.value = r;
        rotationVal.textContent = r;
        flipCheckbox.checked = f;
    }

    // 2. Handle Manual Sliders
    function handleManualChange() {
        // Uncheck all presets
        mutationRadios.forEach(r => r.checked = false);

        const b = parseFloat(brightnessSlider.value);
        const r = parseInt(rotationSlider.value);
        const f = flipCheckbox.checked;

        let rate = 0.0;
        
        // Simple heuristic matching notebook boundary values
        if (b <= 0.1) rate = 93.5; 
        else if (b >= 2.0) rate = 55.0; 
        else if (b < 0.8 || b > 1.2) rate = 3.5; 
        
        if (r > 5 && r < 355) {
            if (rate < 1.0) rate = 1.0; 
        }

        if (f) rate += 1.0; 

        rate = Math.min(rate, 100.0);
        updateFailureUI(rate);
    }

    function updateFailureUI(rate) {
        failureRateDisplay.textContent = `${rate.toFixed(1)}%`;
        
        if (rate > 50) {
            failureRateDisplay.style.color = 'var(--danger-color)';
        } else if (rate > 10) {
            failureRateDisplay.style.color = 'var(--warning-color)';
        } else {
            failureRateDisplay.style.color = 'var(--success-color)';
        }

        if (!resultArea.classList.contains('hidden') && originalDataUrl) {
            imagePreview.src = originalDataUrl;
            showArea(previewArea);
        }
    }

    brightnessSlider.addEventListener('input', (e) => {
        brightnessVal.textContent = e.target.value;
        handleManualChange();
    });

    rotationSlider.addEventListener('input', (e) => {
        rotationVal.textContent = e.target.value;
        handleManualChange();
    });

    flipCheckbox.addEventListener('change', () => {
        handleManualChange();
    });



    // --- Upload Handlers ---
    browseBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', (e) => {
        if(e.target !== browseBtn) fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFile(fileInput.files[0]);
        }
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        currentFile = file;
        
        // Setup preview
        const reader = new FileReader();
        reader.onload = (e) => {
            originalDataUrl = e.target.result;
            imagePreview.src = originalDataUrl;
            showArea(previewArea);
        };
        reader.readAsDataURL(file);
    }

    // --- Remove Image ---
    removeBtn.addEventListener('click', () => {
        currentFile = null;
        originalDataUrl = null;
        fileInput.value = '';
        showArea(uploadArea);
    });

    // --- Reset ---
    resetBtn.addEventListener('click', () => {
        // Just go back to preview with original image
        if (originalDataUrl) {
            imagePreview.src = originalDataUrl;
            showArea(previewArea);
        } else {
            currentFile = null;
            fileInput.value = '';
            showArea(uploadArea);
        }
        confidenceFill.style.width = '0%';
    });

    // --- Predict ---
    predictBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        showArea(loadingArea);

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('brightness', brightnessSlider.value);
        formData.append('rotation', rotationSlider.value);
        formData.append('flip', flipCheckbox.checked);

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to analyze image');
            }

            const result = await response.json();
            
            if (result.error) {
                alert('Error from server: ' + result.error);
                imagePreview.src = originalDataUrl;
                showArea(previewArea);
                return;
            }
            
            // Format class name
            const formattedName = result.prediction.replace(/___/g, ' - ').replace(/_/g, ' ');
            diseaseName.textContent = formattedName;
            
            const confidence = parseFloat(result.confidence).toFixed(1);
            confidenceValue.textContent = confidence;
            
            // Update latency if available
            const latencyValue = document.getElementById('latencyValue');
            if (latencyValue && result.latency_ms !== undefined) {
                latencyValue.textContent = parseFloat(result.latency_ms).toFixed(2);
            } else if (latencyValue) {
                latencyValue.textContent = "Error";
            }
            
            // Adjust confidence color
            if (confidence > 90) {
                confidenceFill.style.backgroundColor = 'var(--success-color)';
            } else if (confidence > 70) {
                confidenceFill.style.backgroundColor = 'var(--warning-color)';
            } else {
                confidenceFill.style.backgroundColor = 'var(--danger-color)';
            }
            
            // Update preview image to show the mutated version from backend
            if (result.mutated_image) {
                imagePreview.src = result.mutated_image;
            }
            
            showArea(resultArea);
            
            // Animate confidence bar
            setTimeout(() => {
                confidenceFill.style.width = `${confidence}%`;
            }, 100);

        } catch (error) {
            alert('Error: ' + error.message);
            imagePreview.src = originalDataUrl;
            showArea(previewArea);
        }
    });

    // --- Utility ---
    function showArea(areaToShow) {
        uploadArea.classList.add('hidden');
        previewArea.classList.add('hidden');
        loadingArea.classList.add('hidden');
        resultArea.classList.add('hidden');
        
        // Also hide result card image if we are showing it in resultArea
        // Actually, we keep the image in the wrapper, so no extra code needed here
        // We just toggle the visibility of the containers.
        if (areaToShow === resultArea) {
            // we show the image wrapper alongside the result area
            areaToShow.classList.remove('hidden');
            document.querySelector('.image-wrapper').parentElement.classList.remove('hidden'); 
            // Wait, .image-wrapper is inside previewArea. 
            // Let's move the image wrapper to be always visible when preview or result is active.
        } else {
            areaToShow.classList.remove('hidden');
        }
    }
    
    // Slight tweak to showArea logic since I want the image to remain visible with the results.
    // The previous design hid previewArea. I will adjust it so the image wrapper stays.
    // Overriding showArea to fix this:
    function showArea(areaToShow) {
        uploadArea.classList.add('hidden');
        previewArea.classList.add('hidden');
        loadingArea.classList.add('hidden');
        resultArea.classList.add('hidden');
        
        if (areaToShow === resultArea) {
            // Show both preview (for the image) and result
            previewArea.classList.remove('hidden');
            predictBtn.classList.add('hidden'); // hide predict button
            removeBtn.classList.add('hidden'); // hide remove button
            resultArea.classList.remove('hidden');
        } else {
            if (areaToShow === previewArea) {
                predictBtn.classList.remove('hidden');
                removeBtn.classList.remove('hidden');
            }
            areaToShow.classList.remove('hidden');
        }
    }
});
