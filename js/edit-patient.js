
        function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }

        // --- BACKGROUND ANIMATION ---
        const canvas = document.getElementById('neuro-bg');
        const ctx = canvas.getContext('2d');
        let width, height, particles = [];
        function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; initParticles(); }
        function initParticles() {
            particles = [];
            const count = Math.floor(width / 15);
            for (let i = 0; i < count; i++) {
                particles.push({x: Math.random()*width, y: Math.random()*height, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5, size: Math.random()*2.5+1});
            }
        }
        function animate() {
            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = 'rgba(168, 85, 247, 0.9)'; ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)'; 
            for(let i=0; i<particles.length; i++) {
                let p = particles[i]; p.x+=p.vx; p.y+=p.vy;
                if(p.x<0||p.x>width) p.vx*=-1; if(p.y<0||p.y>height) p.vy*=-1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; 
                for(let j=i+1; j<particles.length; j++) {
                    let p2=particles[j];
                    if(Math.sqrt((p.x-p2.x)**2+(p.y-p2.y)**2)<120){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(p2.x,p2.y); ctx.stroke(); }
                }
            }
            requestAnimationFrame(animate);
        }
        window.addEventListener('resize', resize); resize(); animate();

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
                botDiv.innerHTML = "Updating database...";
                chatBody.appendChild(botDiv);
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 1000);
        }
        function handleKeyPress(e) { if(e.key === 'Enter') sendChatMessage(); }

        // --- EDIT LOGIC ---
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const patientId = urlParams.get('id');

            if(!patientId) {
                alert("No patient ID specified.");
                window.location.href = '/patient-records';
                return;
            }

            document.getElementById('patientIdDisplay').innerText = patientId;
            document.getElementById('patientId').value = patientId;

            // Mock Data or LocalStorage
            const patients = JSON.parse(localStorage.getItem('patients')) || [];
            const patient = patients.find(p => p.id === patientId);

            if(patient) {
                document.getElementById('fullName').value = patient.name;
                document.getElementById('dob').value = patient.dob || '1990-01-01';
                document.getElementById('contact').value = patient.contact || '';
                document.getElementById('emergency').value = patient.emergency || '';
                document.getElementById('mutation').value = patient.mutation || 'unknown';
                document.getElementById('medications').value = patient.medications || '';
            } else {
                // Fallback Mock Data
                document.getElementById('fullName').value = "Sample Patient";
                document.getElementById('dob').value = "1985-05-20";
                document.getElementById('contact').value = "(555) 123-4567";
                document.getElementById('emergency').value = "(555) 987-6543";
                document.getElementById('mutation').value = "positive";
                document.getElementById('medications').value = "Valproate 500mg, Clobazam 10mg";
            }
        });

        document.getElementById('editPatientForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const id = document.getElementById('patientId').value;
            const name = document.getElementById('fullName').value;
            const dob = document.getElementById('dob').value;
            
            // Age Calc
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }

            let patients = JSON.parse(localStorage.getItem('patients')) || [];
            const index = patients.findIndex(p => p.id === id);
            
            const updatedData = {
                id: id,
                name: name,
                age: age,
                dob: dob,
                visit: new Date().toISOString().split('T')[0],
                contact: document.getElementById('contact').value,
                emergency: document.getElementById('emergency').value,
                mutation: document.getElementById('mutation').value,
                medications: document.getElementById('medications').value
            };

            if(index !== -1) patients[index] = updatedData;
            else patients.push(updatedData);

            localStorage.setItem('patients', JSON.stringify(patients));
            
            alert('Patient Records Updated Successfully!');
            window.location.href = '/patient-records';
        });
    
