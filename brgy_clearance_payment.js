// Global variables
let selectedMethod = '';
let selectedRating = 0;

// Replace this with your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeStarRating();
    initializeFileUpload();
    initializeFormValidation();
    setDefaultDate();
});

// Payment method selection
function selectMethod(method) {
    selectedMethod = method;
    
    // Remove active class from all method options
    document.querySelectorAll('.method-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add active class to selected method
    document.querySelector(`[onclick="selectMethod('${method}')"]`).classList.add('selected');
    
    // Hide all payment details
    document.querySelectorAll('.payment-details').forEach(detail => {
        detail.classList.remove('active');
    });
    
    // Show selected payment details
    let detailsId = '';
    switch(method) {
        case 'qrph':
            detailsId = 'qrphDetails';
            break;
        case 'bank':
            detailsId = 'bankDetails';
            break;
        case 'gcash':
            detailsId = 'gcashDetails';
            break;
    }
    
    if (detailsId) {
        document.getElementById(detailsId).classList.add('active');
    }
    
    // Show upload section
    document.getElementById('uploadSection').style.display = 'block';
    
    // Show/hide GCash number field based on payment method
    const gcashNumberContainer = document.getElementById('gcashNumberContainer');
    if (method === 'gcash') {
        gcashNumberContainer.style.display = 'block';
        document.getElementById('gcashNumber').setAttribute('required', '');
    } else {
        gcashNumberContainer.style.display = 'none';
        document.getElementById('gcashNumber').removeAttribute('required');
    }
    
    // Show feedback section
    document.getElementById('feedbackSection').style.display = 'block';
    
    // Show submit button
    document.getElementById('submitBtn').style.display = 'block';
}

// Copy to clipboard function
function copyToClipboard(text) {
    // Create a temporary textarea element
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);
    
    // Select and copy the text
    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999); // For mobile devices
    
    try {
        document.execCommand('copy');
        
        // Find the button that was clicked and show feedback
        const buttons = document.querySelectorAll('.copy-btn');
        buttons.forEach(btn => {
            if (btn.onclick && btn.onclick.toString().includes(text)) {
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                btn.style.background = '#27ae60';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#129F29';
                }, 2000);
            }
        });
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
    
    // Remove the temporary textarea
    document.body.removeChild(tempTextArea);
}

// Initialize star rating
function initializeStarRating() {
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');
    const serviceRating = document.getElementById('serviceRating');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', function() {
            selectedRating = index + 1;
            serviceRating.value = selectedRating;
            updateStarDisplay();
            updateRatingText();
        });
        
        star.addEventListener('mouseenter', function() {
            highlightStars(index + 1);
        });
    });
    
    document.querySelector('.star-rating').addEventListener('mouseleave', function() {
        updateStarDisplay();
    });
    
    function updateStarDisplay() {
        stars.forEach((star, index) => {
            if (index < selectedRating) {
                star.classList.add('active');
                star.style.color = '#ffd700';
            } else {
                star.classList.remove('active');
                star.style.color = '#ddd';
            }
        });
    }
    
    function highlightStars(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#ffd700';
            } else {
                star.style.color = '#ddd';
            }
        });
    }
    
    function updateRatingText() {
        const ratingTexts = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        ratingText.textContent = ratingTexts[selectedRating] || 'Click to rate';
    }
}

// Initialize file upload
function initializeFileUpload() {
    const fileInput = document.getElementById('paymentProof');
    const fileName = document.getElementById('fileName');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = `Selected file: ${file.name}`;
            fileName.classList.add('show');
        } else {
            fileName.classList.remove('show');
        }
    });
}

// Initialize form validation
function initializeFormValidation() {
    const gcashNumberInput = document.getElementById('gcashNumber');
    const gcashError = document.getElementById('gcashError');
    const emailInput = document.getElementById('senderEmail');
    const emailError = document.getElementById('emailError');
    
    gcashNumberInput.addEventListener('input', function() {
        validateGCashNumber();
    });
    
    gcashNumberInput.addEventListener('blur', function() {
        validateGCashNumber();
    });

    emailInput.addEventListener('input', function() {
        validateEmail();
    });

    emailInput.addEventListener('blur', function() {
        validateEmail();
    });
    
    function validateGCashNumber() {
        const gcashNumber = gcashNumberInput.value;
        const gcashPattern = /^09\d{9}$/;
        
        if (gcashNumber && !gcashPattern.test(gcashNumber)) {
            gcashError.classList.add('show');
            gcashNumberInput.style.borderColor = '#e74c3c';
            return false;
        } else {
            gcashError.classList.remove('show');
            gcashNumberInput.style.borderColor = '#e0e0e0';
            return true;
        }
    }

    function validateEmail() {
        const email = emailInput.value;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailPattern.test(email)) {
            emailError.classList.add('show');
            emailInput.style.borderColor = '#e74c3c';
            return false;
        } else {
            emailError.classList.remove('show');
            emailInput.style.borderColor = '#e0e0e0';
            return true;
        }
    }
}

// Set default date to today
function setDefaultDate() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById('transactionDate').value = formattedDate;
}

// Form submission - UPDATED to send to Google Sheets
async function submitForm() {
    // Show loading state
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Validate required fields
        if (!validateForm()) {
            return;
        }
        
        // Collect form data
        const formData = await collectFormData();
        
        // Send to Google Sheets
        console.log('Sending data to:', GOOGLE_SCRIPT_URL);
        console.log('Data being sent:', formData);
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                formType: 'paymentForm',
                ...formData
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Response data:', result);
            
            if (result.status === 'success') {
                showSuccessMessage(formData);
                // Reset form after successful submission
                setTimeout(() => {
                    resetForm();
                }, 3000);
            } else {
                throw new Error(result.message || 'Submission failed');
            }
        } else {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`Network error: ${response.status} - ${errorText}`);
        }
        
    } catch (error) {
        console.error('Submission error:', error);
        alert('There was an error submitting your form. Please try again.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Validate form
function validateForm() {
    let isValid = true;
    const errors = [];
    
    // Check if payment method is selected
    if (!selectedMethod) {
        errors.push('Please select a payment method');
        isValid = false;
    }
    
    // Check if payment proof is uploaded
    const paymentProof = document.getElementById('paymentProof').files[0];
    if (!paymentProof) {
        errors.push('Please upload payment proof');
        isValid = false;
    }
    
    // Check sender name
    const senderName = document.getElementById('senderName').value.trim();
    if (!senderName) {
        errors.push('Please enter your name');
        document.getElementById('senderName').style.borderColor = '#e74c3c';
        isValid = false;
    } else {
        document.getElementById('senderName').style.borderColor = '#e0e0e0';
    }

    // Check email
    const senderEmail = document.getElementById('senderEmail').value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!senderEmail || !emailPattern.test(senderEmail)) {
        errors.push('Please enter a valid email address');
        document.getElementById('emailError').classList.add('show');
        document.getElementById('senderEmail').style.borderColor = '#e74c3c';
        isValid = false;
    } else {
        document.getElementById('emailError').classList.remove('show');
        document.getElementById('senderEmail').style.borderColor = '#e0e0e0';
    }
    
    // Check GCash number if GCash is selected
    if (selectedMethod === 'gcash') {
        const gcashNumber = document.getElementById('gcashNumber').value.trim();
        const gcashPattern = /^09\d{9}$/;
        
        if (!gcashNumber || !gcashPattern.test(gcashNumber)) {
            errors.push('Please enter a valid GCash number');
            document.getElementById('gcashError').classList.add('show');
            document.getElementById('gcashNumber').style.borderColor = '#e74c3c';
            isValid = false;
        }
    }
    
    // Check transaction date
    const transactionDate = document.getElementById('transactionDate').value;
    if (!transactionDate) {
        errors.push('Please select payment date');
        document.getElementById('transactionDate').style.borderColor = '#e74c3c';
        isValid = false;
    } else {
        document.getElementById('transactionDate').style.borderColor = '#e0e0e0';
    }
    
    // Check service rating
    if (selectedRating === 0) {
        errors.push('Please rate our service');
        isValid = false;
    }
    
    // Show errors if any
    if (!isValid) {
        alert('Please fix the following errors:\n' + errors.join('\n'));
    }
    
    return isValid;
}

// Collect form data - UPDATED to handle file conversion
async function collectFormData() {
    const paymentProof = document.getElementById('paymentProof').files[0];
    const senderName = document.getElementById('senderName').value.trim();
    const senderEmail = document.getElementById('senderEmail').value.trim();
    const gcashNumber = document.getElementById('gcashNumber').value.trim();
    const transactionDate = document.getElementById('transactionDate').value;
    const feedbackComments = document.getElementById('feedbackComments').value.trim();
    
    // Convert file to base64 for sending to Google Apps Script
    let fileData = null;
    if (paymentProof) {
        fileData = {
            name: paymentProof.name,
            type: paymentProof.type,
            size: paymentProof.size,
            data: await fileToBase64(paymentProof)
        };
    }
    
    return {
        paymentMethod: selectedMethod,
        paymentProof: fileData,
        senderName,
        senderEmail,
        gcashNumber,
        transactionDate,
        rating: selectedRating,
        feedbackComments,
        submissionDate: new Date().toISOString()
    };
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Show success message
function showSuccessMessage(formData) {
    alert(`Payment and feedback submitted successfully!\n\n` +
          `Payment Method: ${formData.paymentMethod}\n` +
          `Name: ${formData.senderName}\n` +
          `Email: ${formData.senderEmail}\n` +
          `Rating: ${formData.rating} stars\n\n` +
          `Thank you for your feedback!`);
}

// Reset form
function resetForm() {
    // Reset payment method selection
    selectedMethod = '';
    document.querySelectorAll('.method-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.querySelectorAll('.payment-details').forEach(detail => {
        detail.classList.remove('active');
    });
    
    // Reset file upload
    document.getElementById('paymentProof').value = '';
    document.getElementById('fileName').classList.remove('show');
    
    // Reset form fields
    document.getElementById('senderName').value = '';
    document.getElementById('senderEmail').value = '';
    document.getElementById('gcashNumber').value = '';
    document.getElementById('feedbackComments').value = '';
    
    // Reset rating
    selectedRating = 0;
    document.getElementById('serviceRating').value = '';
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
        star.style.color = '#ddd';
    });
    document.getElementById('ratingText').textContent = 'Click to rate';
    
    // Hide sections
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('feedbackSection').style.display = 'none';
    document.getElementById('submitBtn').style.display = 'none';
    
    // Set default date again
    setDefaultDate();
}