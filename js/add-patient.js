
        function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }

        // --- BACKGROUND ANIMATION ---
        const canvas = document.getElementById('neuro-bg');
        const ctx = canvas.getContext('2d');
        let width, height, particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            initParticles();
        }

        function initParticles() {
            particles = [];
            const count = Math.floor(width / 15);
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    size: Math.random() * 2.5 + 1
                });
            }
        }

        function animate() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(168, 85, 247, 0.9)'; 
            ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)'; 

            for (let i = 0; i < particles.length; i++) {
                let p = particles[i];
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0; 

                for (let j = i + 1; j < particles.length; j++) {
                    let p2 = particles[j];
                    let dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);
                    if (dist < 120) {
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        }
        window.addEventListener('resize', resize);
        resize(); animate();

        // --- CHATBOT ---
        function toggleChat(show) {
            const panel = document.getElementById('chatPanel');
            const fab = document.getElementById('fabChat');
            if(show) { panel.classList.add('active'); fab.classList.add('hidden'); }
            else { panel.classList.remove('active'); fab.classList.remove('hidden'); }
        }

        function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const chatBody = document.getElementById('chatBody');
            if(input.value.trim() === "") return;
            const userDiv = document.createElement('div');
            userDiv.className = 'msg msg-user';
            userDiv.innerText = input.value;
            chatBody.appendChild(userDiv);
            input.value = "";
            chatBody.scrollTop = chatBody.scrollHeight;
            setTimeout(() => {
                const botDiv = document.createElement('div');
                botDiv.className = 'msg msg-bot';
                botDiv.innerHTML = "I am processing your request...";
                chatBody.appendChild(botDiv);
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 1000);
        }
        function handleKeyPress(e) { if(e.key === 'Enter') sendChatMessage(); }

        // --- SAVE LOGIC ---
        document.getElementById('addPatientForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const fname = document.getElementById('firstName').value;
            const lname = document.getElementById('lastName').value;
            const dob = document.getElementById('dob').value;
            const genderRaw = document.getElementById('gender').value;
            const contact = document.getElementById('contact').value;
            const emergency = document.getElementById('emergency').value;
            const mutation = document.getElementById('mutation').value;
            const medications = document.getElementById('medications').value;
            const notes = document.getElementById('notes').value;

            // Calculate age from DOB
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }

            // Convert gender to proper case for backend
            const genderMap = { 'male': 'Male', 'female': 'Female', 'other': 'Other' };
            const gender = genderMap[genderRaw] || 'Other';

            const newPatient = {
                name: fname + ' ' + lname,
                age: age,
                gender: gender,
                phone: contact,
                medicalHistory: `DOB: ${dob}, Emergency Contact: ${emergency}, Mutation Status: ${mutation}`,
                currentMedications: medications,
                allergies: notes,
                lastVisit: new Date().toISOString()
            };

            const token = localStorage.getItem('token');

            try {
                const response = await fetch('/api/patients', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newPatient)
                });

                if (response.ok) {
                    alert('Patient Saved Successfully!');
                    window.location.href = '/patient-records';
                } else {
                    const error = await response.json();
                    alert('Error saving patient: ' + (error.message || error.errors?.[0]?.msg || 'Unknown error'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error saving patient. Please try again.');
            }
        });
    
