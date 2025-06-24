// Global variables
let selectedMethod = '';
let selectedRating = 0;

// Replace this with your actual Google Apps Script Web App URL
// Get this URL from: Google Apps Script → Deploy → New deployment → Web app
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYXaobjYu8zQUvUFGTzS2sib-fCyQpG4Sx4qMfxUSWEZF2GuFfAVAiynRb1Wec--L2eA/exec';

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
        // Fallback for modern browsers
        navigator.clipboard.writeText(text).catch(e => {
            console.error('Clipboard API failed: ', e);
        });
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
            // Check file size (limit to 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File size too large. Please select a file smaller than 10MB.');
                fileInput.value = '';
                fileName.classList.remove('show');
                return;
            }
            
            fileName.textContent = `Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
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

// Form submission - Enhanced with better error handling
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
        
        console.log('Form validation passed, collecting data...');
        
        // Collect form data
        const formData = await collectFormData();
        
        console.log('Form data collected:', {
            paymentMethod: formData.paymentMethod,
            senderName: formData.senderName,
            senderEmail: formData.senderEmail,
            rating: formData.rating,
            hasFile: !!formData.paymentProof
        });
        
        // Prepare the payload
        const payload = {
            formType: 'paymentForm',
            ...formData
        };
        
        console.log('Sending to Google Apps Script:', GOOGLE_SCRIPT_URL);
        
        // Send to Google Apps Script
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Apps Script
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        // Note: With no-cors mode, we can't read the response
        // But if no error is thrown, we assume success
        console.log('Request sent successfully');
        
        // Show success message
        showSuccessMessage(formData);
        
        // Reset form after successful submission
        setTimeout(() => {
            resetForm();
        }, 3000);
        
    } catch (error) {
        console.error('Submission error:', error);
        
        // Show detailed error message
        let errorMessage = 'There was an error submitting your form. ';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message.includes('GOOGLE_SCRIPT_URL')) {
            errorMessage += 'The form is not properly configured. Please contact support.';
        } else {
            errorMessage += 'Please try again in a few moments.';
        }
        
        alert(errorMessage);
        
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Enhanced form validation with better error messages
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
    } else {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
        if (!allowedTypes.includes(paymentProof.type)) {
            errors.push('Please upload a valid image file (JPG, PNG, GIF) or PDF');
            isValid = false;
        }
        
        // Validate file size (10MB limit)
        if (paymentProof.size > 10 * 1024 * 1024) {
            errors.push('File size must be less than 10MB');
            isValid = false;
        }
    }
    
    // Check sender name
    const senderName = document.getElementById('senderName').value.trim();
    if (!senderName) {
        errors.push('Please enter your name');
        document.getElementById('senderName').style.borderColor = '#e74c3c';
        isValid = false;
    } else if (senderName.length < 2) {
        errors.push('Name must be at least 2 characters long');
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
            errors.push('Please enter a valid GCash number (09XXXXXXXXX)');
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
        // Check if date is not in the future
        const selectedDate = new Date(transactionDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        if (selectedDate > today) {
            errors.push('Payment date cannot be in the future');
            document.getElementById('transactionDate').style.borderColor = '#e74c3c';
            isValid = false;
        } else {
            document.getElementById('transactionDate').style.borderColor = '#e0e0e0';
        }
    }
    
    // Check service rating
    if (selectedRating === 0) {
        errors.push('Please rate our service');
        isValid = false;
    }
    
    // Show errors if any
    if (!isValid) {
        alert('Please fix the following errors:\n• ' + errors.join('\n• '));
    }
    
    return isValid;
}

// Collect form data with better error handling
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
        try {
            console.log('Converting file to base64...');
            fileData = {
                name: paymentProof.name,
                type: paymentProof.type,
                size: paymentProof.size,
                data: await fileToBase64(paymentProof)
            };
            console.log('File converted successfully');
        } catch (error) {
            console.error('Error converting file:', error);
            throw new Error('Failed to process the uploaded file. Please try again.');
        }
    }
    
    return {
        paymentMethod: selectedMethod,
        paymentProof: fileData,
        senderName,
        senderEmail,
        gcashNumber: selectedMethod === 'gcash' ? gcashNumber : '',
        transactionDate,
        rating: selectedRating,
        feedbackComments,
        submissionDate: new Date().toISOString()
    };
}

// Convert file to base64 with error handling
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
            try {
                resolve(reader.result);
            } catch (error) {
                reject(new Error('Failed to read file data'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read the file. Please try selecting the file again.'));
        };
        
        reader.onabort = () => {
            reject(new Error('File reading was aborted. Please try again.'));
        };
        
        reader.readAsDataURL(file);
    });
}

// Show enhanced success message
function showSuccessMessage(formData) {
    const methodNames = {
        'qrph': 'QR PH',
        'bank': 'Bank Transfer',
        'gcash': 'GCash'
    };
    
    const ratingText = {
        1: '⭐ Poor',
        2: '⭐⭐ Fair', 
        3: '⭐⭐⭐ Good',
        4: '⭐⭐⭐⭐ Very Good',
        5: '⭐⭐⭐⭐⭐ Excellent'
    };
    
    const message = `✅ Payment and feedback submitted successfully!\n\n` +
          `📋 Submission Details:\n` +
          `• Payment Method: ${methodNames[formData.paymentMethod]}\n` +
          `• Name: ${formData.senderName}\n` +
          `• Email: ${formData.senderEmail}\n` +
          `• Rating: ${ratingText[formData.rating]}\n` +
          `• Date: ${formData.transactionDate}\n\n` +
          `🙏 Thank you for your payment and feedback!\n` +
          `We'll process your submission shortly.`;
          
    alert(message);
}

// Enhanced form reset
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
    
    // Reset field styles
    document.querySelectorAll('input, textarea').forEach(field => {
        field.style.borderColor = '#e0e0e0';
    });
    
    // Hide error messages
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
    });
    
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
    document.getElementById('gcashNumberContainer').style.display = 'none';
    
    // Set default date again
    setDefaultDate();
    
    console.log('Form reset completed');
}

// Test function for debugging
function testConnection() {
    console.log('Testing connection to:', GOOGLE_SCRIPT_URL);
    
    if (GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID_HERE')) {
        console.error('❌ Google Apps Script URL not configured!');
        alert('The form is not properly configured. Please set up the Google Apps Script URL.');
        return false;
    }
    
    console.log('✅ URL looks configured');
    return true;
}

// Call test on page load in development
// Uncomment the line below for testing
// document.addEventListener('DOMContentLoaded', testConnection);