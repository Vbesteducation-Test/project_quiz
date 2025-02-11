document.getElementById('education').addEventListener('change', function() {
    let schoolGroup = document.getElementById('school-group');
    let collegeGroup = document.getElementById('college-group');
    let collegeIdGroup = document.getElementById('college-id-group');

    
    schoolGroup.classList.add('hidden');
    collegeGroup.classList.add('hidden');
    collegeIdGroup.classList.add('hidden');

    
    if (this.value === 'school') {
        schoolGroup.classList.remove('hidden');
    } else if (this.value === 'college') {
        collegeGroup.classList.remove('hidden');
        collegeIdGroup.classList.remove('hidden');
    }
});

document.getElementById('registration-form').addEventListener('submit', function(event) {
    event.preventDefault();
    
    
    alert('Registration Successful! Redirecting to Quiz Page...');
    
    
    window.location.href = "index.html";
});