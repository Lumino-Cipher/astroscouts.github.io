// Your Firebase Configuration
// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWRCL_1gTnsZBcpX5l_5BF2-QMMY9nIYM",
  authDomain: "parkratingform.firebaseapp.com",
  projectId: "parkratingform",
  storageBucket: "parkratingform.firebasestorage.app",
  messagingSenderId: "784897205276",
  appId: "1:784897205276:web:6f5330566e31fcd605abd9",
  measurementId: "G-BZ33WZQ78C"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the Firestore database and Storage
const db = firebase.firestore();
const storage = firebase.storage();

// Add this function, for example, right after your Firebase initialization
// const storage = firebase.storage();

function resizeImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions to fit within maxWidth/maxHeight while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                // Draw image with the new dimensions
                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas content to a Blob
                // The third argument (quality) is only for image/jpeg and image/webp types
                canvas.toBlob(blob => {
                    if (blob) {
                        // Create a new File object from the Blob
                        // This new File object can then be uploaded to Firebase Storage
                        const resizedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(resizedFile);
                    } else {
                        reject(new Error("Canvas toBlob failed."));
                    }
                }, file.type, quality);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Single leaf image URL
    const leafImage = "https://marketplace.canva.com/ARZ8E/MAFmAUARZ8E/1/tl/canva-natural-leaf-icon.-100%25-naturals-vector-image-MAFmAUARZ8E.png";

    const reviewForm = document.getElementById('parkRatingForm');
    const loadingOverlay = document.getElementById('loadingOverlay');

    // Function to show the loading overlay
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    // Function to hide the loading overlay
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    // Function to initialize star ratings
    function initializeStarRating(starsContainer) {
        const maxStars = parseInt(starsContainer.dataset.maxStars) || 5;
        const ratingName = starsContainer.dataset.name;

        // Create stars if they don't exist
        if (starsContainer.children.length === 0) {
            for (let i = 1; i <= maxStars; i++) {
                const star = document.createElement('i');
                star.classList.add('far', 'fa-star');
                star.dataset.value = i;
                star.title = `${i} star${i > 1 ? 's' : ''}`;
                starsContainer.appendChild(star);
            }
        }

        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = ratingName + 'Rating';
        hiddenInput.classList.add('hidden-star-rating');
        starsContainer.parentNode.insertBefore(hiddenInput, starsContainer.nextSibling);

        const allStars = starsContainer.querySelectorAll('.fa-star');

        starsContainer.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('fa-star')) {
                const value = parseInt(e.target.dataset.value);
                allStars.forEach(star => {
                    star.classList.toggle('selected', parseInt(star.dataset.value) <= value);
                    star.classList.remove('far'); // Remove outline
                    star.classList.add('fas'); // Add solid
                });
            }
        });

        starsContainer.addEventListener('mouseout', (e) => {
            const currentRating = parseInt(starsContainer.dataset.rating);
            allStars.forEach(star => {
                if (parseInt(star.dataset.value) <= currentRating) {
                    star.classList.remove('far');
                    star.classList.add('fas', 'selected');
                } else {
                    star.classList.remove('fas', 'selected');
                    star.classList.add('far');
                }
            });
        });

        starsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('fa-star')) {
                const value = parseInt(e.target.dataset.value);
                starsContainer.dataset.rating = value;
                hiddenInput.value = value;
                allStars.forEach(star => {
                    star.classList.toggle('selected', parseInt(star.dataset.value) <= value);
                    star.classList.remove('far');
                    star.classList.add('fas');
                });
                // The checkPhase1Ratings is no longer needed to control Phase 2 visibility
                // if (['accessibility', 'cleanliness', 'sustainability'].includes(ratingName)) {
                //     checkPhase1Ratings();
                // }
            }
        });

        // Function to set rating programmatically
        starsContainer.setRating = function(value) {
            value = Math.max(0, Math.min(value, maxStars)); // Clamp value
            starsContainer.dataset.rating = value;
            hiddenInput.value = value;
            allStars.forEach(star => {
                if (parseInt(star.dataset.value) <= value) {
                    star.classList.remove('far');
                    star.classList.add('fas', 'selected');
                } else {
                    star.classList.remove('fas', 'selected');
                    star.classList.add('far');
                }
            });
            // The checkPhase1Ratings is no longer needed to control Phase 2 visibility
            // if (['accessibility', 'cleanliness', 'sustainability'].includes(ratingName)) {
            //     checkPhase1Ratings();
            // }
        };
    }

    // Initialize all star rating groups
    document.querySelectorAll('.stars').forEach(initializeStarRating);

    // Explanation Toggle functionality
    document.querySelectorAll('.explain-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const explanationTextarea = this.nextElementSibling;
            explanationTextarea.style.display = explanationTextarea.style.display === 'block' ? 'none' : 'block';
            this.textContent = explanationTextarea.style.display === 'block' ? 'Hide explanation' : 'Click below to explain why you chose this (optional)';
        });
    });

    // GPS Auto-Detect (Real API)
    document.getElementById('gpsDetect').addEventListener('click', function(e) {
        e.preventDefault();
        const parkNameInput = document.getElementById('parkName');
        parkNameInput.value = "Detecting...";
        parkNameInput.disabled = true; // Disable input while detecting

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => { // Added 'async' keyword here
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    // --- Real API Call (Google Maps Geocoding API) ---
                    const Maps_API_KEY = "AIzaSyDtwsuRgrCYS1hlgQ7Ctu1CKraoZ-tzXsk"; // ⚠️ Replace with your actual API Key

                    const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${Maps_API_KEY}`;

                    try {
                        const response = await fetch(geocodingUrl);
                        const data = await response.json();

                        if (data.status === "OK" && data.results.length > 0) {
                            // Find a suitable place name. You might want to customize this logic
                            // to pick the most relevant result (e.g., a park, a landmark, or a city).
                            let detectedPlaceName = "Unknown Park";

                            // Iterate through results to find a "park" or "natural_feature"
                            const parkResult = data.results.find(result =>
                                result.types.includes("park") || result.types.includes("natural_feature")
                            );

                            if (parkResult) {
                                detectedPlaceName = parkResult.formatted_address;
                            } else if (data.results[0].address_components) {
                                // Fallback to a broader address component like neighborhood or city
                                const neighborhood = data.results[0].address_components.find(comp => comp.types.includes("neighborhood"));
                                const political = data.results[0].address_components.find(comp => comp.types.includes("political"));
                                const locality = data.results[0].address_components.find(comp => comp.types.includes("locality")); // city

                                if (neighborhood) {
                                    detectedPlaceName = neighborhood.long_name;
                                } else if (locality) {
                                    detectedPlaceName = locality.long_name;
                                } else if (political) {
                                    detectedPlaceName = political.long_name;
                                } else {
                                    detectedPlaceName = data.results[0].formatted_address;
                                }
                            } else {
                                 detectedPlaceName = data.results[0].formatted_address;
                            }


                            parkNameInput.value = detectedPlaceName;
                            console.log(`GPS Detected: Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}. Detected Place: ${detectedPlaceName}`);
                        } else {
                            parkNameInput.value = "Park Not Found";
                            console.warn("Geocoding API returned no results or an error:", data.status);
                        }
                    } catch (apiError) {
                        console.error("Error calling Geocoding API:", apiError);
                        parkNameInput.value = "API Error";
                        alert("Error communicating with location services. Please try again.");
                    } finally {
                        parkNameInput.disabled = false;
                    }
                    // --- End Real API Call ---
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    parkNameInput.value = "GPS Detection Failed";
                    parkNameInput.disabled = false;
                    alert("Unable to detect GPS location. Please enter park name manually or ensure location services are enabled and allowed for this site.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
            parkNameInput.value = "Geolocation Not Supported";
            parkNameInput.disabled = false;
        }
    });

    // Phase 2 Expansion Logic (removed the expand button and made it display:block in CSS)
    const phase2Section = document.getElementById('phase2Section');
    // const expandPhase2Button = document.getElementById('expandPhase2'); // This button is no longer needed

    // The checkPhase1Ratings function and its calls are no longer needed
    // as Phase 2 is always visible.
    // function checkPhase1Ratings() {
    //     const essentialRatings = document.querySelectorAll('.stars[data-max-stars="5"]');
    //     let allRated = true;
    //     essentialRatings.forEach(starsContainer => {
    //         if (parseInt(starsContainer.dataset.rating) === 0) {
    //             allRated = false;
    //         }
    //     });

    //     if (allRated) {
    //         expandPhase2Button.style.display = 'block'; // Show the expand button
    //     } else {
    //         expandPhase2Button.style.display = 'none'; // Hide if not all rated
    //     }
    // }

    // Call checkPhase1Ratings on load to set initial state of the button
    // checkPhase1Ratings(); // No longer needed

    // Event listener for expand button (removed)
    // expandPhase2Button.addEventListener('click', function() {
    //     phase2Section.style.display = 'block'; // Show Phase 2
    //     this.style.display = 'none'; // Hide the expand button
    // });

    // Concerns / Issues Tags
    const concernsTagsContainer = document.getElementById('concernsTags');
    const selectedConcernsInput = document.getElementById('selectedConcernsInput');
    const otherConcernTextarea = document.getElementById('otherConcernText');
    let selectedTags = new Set();

    concernsTagsContainer.addEventListener('click', function(e) {
        if (e.target.tagName === 'BUTTON') {
            const tag = e.target.dataset.tag;
            if (selectedTags.has(tag)) {
                selectedTags.delete(tag);
                e.target.classList.remove('selected');
            } else {
                selectedTags.add(tag);
                e.target.classList.add('selected');
            }
            selectedConcernsInput.value = Array.from(selectedTags).join(',');

            // Show/hide 'Other' text area
            if (selectedTags.has('other_concern')) {
                otherConcernTextarea.style.display = 'block';
                otherConcernTextarea.setAttribute('required', 'required'); // Make required if "Other" is selected
            } else {
                otherConcernTextarea.style.display = 'none';
                otherConcernTextarea.removeAttribute('required');
                otherConcernTextarea.value = ''; // Clear content when hidden
            }
        }
    });

    // Photo Upload
    const dropArea = document.getElementById('dropArea');
    const photoUploadInput = document.getElementById('photoUpload');
    const filePreview = document.getElementById('filePreview');
    const MAX_FILES = 5;
    let uploadedFiles = [];

    // Trigger file input click when drop area is clicked
    dropArea.addEventListener('click', () => photoUploadInput.click());

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        // Also prevent default for the document to stop browser from opening file
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop area when item is dragged over
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    photoUploadInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    async function handleFiles(files) { // Make the function async
        for (const file of [...files]) { // Use for...of for async operations
            if (uploadedFiles.length < MAX_FILES && (file.type.match('image/jpeg') || file.type.match('image/png') || file.type.match('image/webp'))) {
                try {
                    // Define your desired max width/height and quality
                    // For example, resize to a maximum of 1280 pixels on the longest side, with 80% quality
                    const resizedFile = await resizeImage(file, 800, 800, 0.5);
                    uploadedFiles.push(resizedFile);
                    previewFile(resizedFile); // Preview the resized file
                } catch (error) {
                    console.error("Error resizing image:", error);
                    alert('Could not process image: ' + file.name + '. Please try another image.');
                }
            } else if (uploadedFiles.length >= MAX_FILES) {
                alert(`You can only upload a maximum of ${MAX_FILES} photos.`);
            } else {
                alert('Only .jpg, .png, and .webp image files are allowed.');
            }
        }
    }

    function previewFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            const imgContainer = document.createElement('div');
            const img = document.createElement('img');
            img.src = reader.result;
            img.alt = file.name;

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '&times;';
            removeBtn.title = 'Remove image';
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent re-triggering file input click
                const index = uploadedFiles.indexOf(file);
                if (index > -1) {
                    uploadedFiles.splice(index, 1);
                }
                imgContainer.remove();
            });

            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            filePreview.appendChild(imgContainer);
        };
    }

    // Handle clicking on image references to set star rating
    document.querySelectorAll('.image-reference-gallery .image-container').forEach(imgContainer => {
        imgContainer.addEventListener('click', function() {
            const ratingValue = parseInt(this.dataset.ratingValue);
            // Find the parent .rating-group and then its .stars element
            const ratingGroup = this.closest('.rating-group');
            const starsElement = ratingGroup.querySelector('.stars');

            if (starsElement && typeof starsElement.setRating === 'function') {
                starsElement.setRating(ratingValue);
            }
        });
    });


    document.getElementById('parkRatingForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitButton = this.querySelector('button[type="submit"]');
        submitButton.disabled = true; // Disable button to prevent multiple submissions
        submitButton.textContent = 'Submitting...';

        // Initialize an empty object to store data for Firestore
        const dataToSave = {};
        // This array will store the download URLs of the uploaded photos
        const photoUrls = [];

        // --- Start: Collect data from form fields ---
        // Iterate over form elements directly to control what's added to dataToSave
        // This avoids issues with FormData potentially containing File objects directly
        // if 'photoUpload' input was included in the initial FormData creation.
        const formElements = this.elements; // Get all elements in the form

        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name && element.value !== undefined) {
                // Exclude the actual file input field from direct addition
                // because we'll handle `uploadedFiles` array separately for storage uploads.
                // Also, exclude the hidden input for selected concerns as it's handled by 'selectedTags'.
                if (element.type !== 'file' && element.name !== 'selectedConcernsInput') {
                    // For star ratings, ensure their values are numbers if they represent ratings
                    if (element.classList.contains('hidden-star-rating')) {
                        dataToSave[element.name] = parseInt(element.value, 10);
                    } else {
                        dataToSave[element.name] = element.value;
                    }
                }
            }
        }

        const selectedWildlifeTypes = [];
            document.querySelectorAll('input[name="wildlifeType"]:checked').forEach(checkbox => {
                selectedWildlifeTypes.push(checkbox.value);
            });
        dataToSave.wildlifeTypes = selectedWildlifeTypes; // Add the array of selected wildlife types

        dataToSave.wildlifeTypes = selectedWildlifeTypes; // Add the array of selected wildlife types
        const selectedAtmospheres = [];
        document.querySelectorAll('input[name="atmosphere"]:checked').forEach(checkbox => {
            selectedAtmospheres.push(checkbox.value);
        });
        dataToSave.atmosphere = selectedAtmospheres;

        const selectedTerrains = [];
        document.querySelectorAll('input[name="terrain"]:checked').forEach(checkbox => {
            selectedTerrains.push(checkbox.value);
        });
        dataToSave.terrain = selectedTerrains;

        const selectedFeatures = [];
        document.querySelectorAll('input[name="features"]:checked').forEach(checkbox => {
            selectedFeatures.push(checkbox.value);
        });
        dataToSave.features = selectedFeatures;

        const selectedCommunityRatings = [];
        document.querySelectorAll('input[name="communityRatings"]:checked').forEach(checkbox => {
            selectedCommunityRatings.push(checkbox.value);
        });
        dataToSave.communityRatings = selectedCommunityRatings;
        
        // --- End: Collect data from form fields ---

        // Manually add selected concern tags from the Set
        dataToSave.selectedConcerns = Array.from(selectedTags);
        if (selectedTags.has('other_concern')) {
            dataToSave.otherConcern = otherConcernTextarea.value;
        } else {
            // Ensure 'otherConcern' is not present if 'other_concern' tag isn't selected
            delete dataToSave.otherConcern;
        }


        // Add a timestamp for when the review was submitted
        dataToSave.timestamp = firebase.firestore.FieldValue.serverTimestamp();

        if (window.selectedPlaceData) {
        
          showLoading();
          
          dataToSave.parkName = window.selectedPlaceData.name || '';
          dataToSave.parkAddress = window.selectedPlaceData.address || '';
          dataToSave.parkLocation = {
            latitude: window.selectedPlaceData.latitude || null,
            longitude: window.selectedPlaceData.longitude || null
          };
        } else {
          alert("Please select a park from the dropdown before submitting.");
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Park Review';
          return;
        }



        try {
            // 1. Upload images to Firebase Storage
            if (uploadedFiles.length > 0) {
                for (const file of uploadedFiles) {
                    // Create a storage reference with a unique name (e.g., timestamp + original filename)
                    // Ensure the path is descriptive, e.g., 'park_photos/unique_id_filename.jpg'
                    const storageRef = storage.ref(`park_photos/${Date.now()}_${file.name}`);

                    // Upload the file
                    const snapshot = await storageRef.put(file);

                    // Get the download URL of the uploaded file
                    const downloadURL = await snapshot.ref.getDownloadURL();
                    photoUrls.push(downloadURL); // Add the URL to our array
                }
                // Add the array of photo URLs to the data to be saved in Firestore
                dataToSave.photos = photoUrls;
            } else {
                // If no photos uploaded, explicitly set photos field to an empty array
                // or ensure it's not present if you prefer. Setting to empty array is safer.
                dataToSave.photos = [];
            }


            // 2. Save the compiled data (including photo URLs) to Firestore
            // Use db.collection().add() to create a new document with an auto-generated ID
            await db.collection('parkReviews').add(dataToSave);

            alert("Thank you for your review! Your data has been saved.");
            console.log("Form data and photos saved to Firestore:", dataToSave);

            // Reset form and UI after successful submission
            this.reset(); // Resets input fields
            filePreview.innerHTML = ''; // Clear photo previews
            uploadedFiles = []; // Clear uploaded files array
            selectedTags.clear(); // Clear selected tags
            document.querySelectorAll('.tag-select button').forEach(btn => btn.classList.remove('selected')); // Deselect tag buttons
            otherConcernTextarea.style.display = 'none'; // Hide other concern textarea
            otherConcernTextarea.value = ''; // Clear other concern text
            document.querySelectorAll('.stars').forEach(container => {
                container.dataset.rating = "0"; // Reset star rating data attribute
                container.querySelectorAll('.fa-star').forEach(star => {
                    star.classList.remove('selected', 'fas'); // Remove filled star classes
                    star.classList.add('far'); // Add empty star class
                });
                // Reset the hidden input values for stars
                const hiddenStarInput = container.parentNode.querySelector('.hidden-star-rating');
                if (hiddenStarInput) {
                    hiddenStarInput.value = "0";
                }
            });
            // phase2Section.style.display = 'none'; // Phase 2 is now always visible, no need to hide
            // expandPhase2Button.style.display = 'none'; // This button is removed
            // checkPhase1Ratings(); // No longer needed

        } catch (error) {
            console.error("Error submitting data:", error);
            alert("There was an error submitting your review. Please try again.");
        } finally {
            hideLoading();
            submitButton.disabled = false; // Re-enable the button
            submitButton.textContent = 'Submit Park Review';
        }
    });

    // particles.js configuration for leaves
    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": 40, // Number of leaves
                "density": {
                    "enable": true,
                    "value_area": 800
                }
            },
            "color": {
                "value": "#ffffff" // Base color, but image will override
            },
            "shape": {
                "type": "image",
                "stroke": {
                    "width": 0,
                    "color": "#000000"
                },
                "polygon": {
                    "nb_sides": 5
                },
                "image": {
                    "src": leafImage, // Use the single, working image
                    "width": 100,
                    "height": 100
                }
            },
            "opacity": {
                "value": 0.6, // Slightly transparent leaves
                "random": true,
                "anim": {
                    "enable": false,
                    "speed": 1,
                    "opacity_min": 0.1,
                    "sync": false
                }
            },
            "size": {
                "value": 25, // Base size of leaves
                "random": true, // Randomize leaf sizes
                "anim": {
                    "enable": false,
                    "speed": 40,
                    "size_min": 0.1,
                    "sync": false
                }
            },
            "rotate": { // Custom rotation for leaves
                "value": 0,
                "random": true,
                "direction": "random", // clockwise, counter-clockwise, random
                "animation": {
                    "enable": true,
                    "speed": 5, // Rotation speed
                    "sync": false
                }
            },
            "line_linked": {
                "enable": false, // No lines between leaves
            },
            "move": {
                "enable": true,
                "speed": 2.5, // Speed of falling
                "direction": "bottom", // Fall downwards
                "random": true, // Randomize direction slightly
                "straight": false,
                "out_mode": "out",
                "bounce": false,
                "attract": {
                    "enable": false,
                    "rotateX": 600,
                    "rotateY": 1200
                }
            }
        },
        "interactivity": {
            "detect_on": "canvas",
            "events": {
                "onhover": {
                    "enable": false, // No interaction on hover
                },
                "onclick": {
                    "enable": false, // No interaction on click
                },
                "resize": true
            }
        },
        "retina_detect": true
    });
    const placeAutocompleteElement = document.getElementById('placeAutocomplete');
    let selectedPlaceData = null; // Store the selected place details

    if (placeAutocompleteElement) {
        placeAutocompleteElement.addEventListener('gmp-select', event => {
            const place = event.detail.place;
            if (place) {
                selectedPlaceData = {
                    name: place.displayName,
                    latitude: place.location?.lat(),
                    longitude: place.location?.lng(),
                    address: place.formattedAddress
                    // You can access more details from the 'place' object if needed
                };
                console.log('Selected Place:', selectedPlaceData.name);
                console.log('Latitude:', selectedPlaceData.latitude);
                console.log('Longitude:', selectedPlaceData.longitude);
                console.log('Full Address:', selectedPlaceData.address);

                // You might want to update a hidden input or another element with the selected place name
                // if the gmp-place-autocomplete itself is not used as the direct form input.
                // For example, if you wanted to store the latitude and longitude:
                // document.getElementById('parkLatitudeInput').value = selectedPlaceData.latitude;
                // document.getElementById('parkLongitudeInput').value = selectedPlaceData.longitude;

            } else {
                console.log('Place selection cleared.');
                selectedPlaceData = null;
            }
        });

        // Optional: You can pre-populate the input if you have a default location
        // placeAutocompleteElement.value = "Central Park";
    }
});

// Load the Google Maps JS API libraries if needed
google.maps.importLibrary("places").then(() => {
  const container = document.getElementById("placeAutocompleteContainer");
  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
  container.appendChild(placeAutocomplete);

  // ✅ Make it a real input so form validation works
  placeAutocomplete.setAttribute("required", "required");

  // ✅ Global object to be accessed later in form submission
  window.selectedPlaceData = null;

  placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
    const place = placePrediction.toPlace();
    await place.fetchFields({
      fields: ['displayName', 'formattedAddress', 'location']
    });

    window.selectedPlaceData = {
      name: place.displayName,
      address: place.formattedAddress,
      latitude: place.location?.lat(),
      longitude: place.location?.lng()
    };

    console.log("✅ Selected Place:", window.selectedPlaceData);
  });
});
