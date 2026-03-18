
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
            ctx.fillStyle = 'rgba(139, 92, 246, 0.9)'; ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
            for (let i = 0; i < particles.length; i++) {
                let p = particles[i]; p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1; if (p.y < 0 || p.y > height) p.vy *= -1;
                ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(139, 92, 246, 0.8)';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
                for (let j = i + 1; j < particles.length; j++) {
                    let p2 = particles[j];
                    if (Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2) < 120) {
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                    }
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
                botDiv.innerHTML = "I am analyzing patient data.";
                chatBody.appendChild(botDiv);
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 1000);
        }
        function handleKeyPress(e) { if(e.key === 'Enter') sendChatMessage(); }

        /* --- DOCTOR INFO FROM LOCALSTORAGE --- */
        function loadDoctorInfo() {
            const doctor = JSON.parse(localStorage.getItem('currentDoctor'));
            if (doctor) {
                document.getElementById('doctorName').textContent = doctor.name || 'Dr. Welcome';
                document.getElementById('doctorId').textContent = doctor.id || '-';
                document.getElementById('doctorHospital').textContent = doctor.hospital || '-';
            }
        }

        /* --- PATIENT LOGIC - FETCH FROM API --- */
        async function loadPatients() {
            const tbody = document.getElementById('patientTableBody');
            const token = localStorage.getItem('token');

            try {
                const response = await fetch('/api/patients', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const patients = await response.json();
                    renderPatients(patients);
                } else {
                    // If API fails, show empty state
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 2rem;">No patients found. Add your first patient!</td></tr>';
                    document.getElementById('patientCountLabel').innerText = 'Total Patients: 0';
                }
            } catch (error) {
                console.error('Error fetching patients:', error);
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 2rem;">Unable to load patients. Please try again.</td></tr>';
                document.getElementById('patientCountLabel').innerText = 'Total Patients: 0';
            }
        }

        function renderPatients(patients) {
            const tbody = document.getElementById('patientTableBody');
            tbody.innerHTML = '';

            if (patients.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #6b7280; padding: 2rem;">No patients found. Add your first patient!</td></tr>';
                document.getElementById('patientCountLabel').innerText = 'Total Patients: 0';
                return;
            }

            patients.forEach(patient => {
                const row = document.createElement('tr');
                const patientId = patient.patientId || patient._id;
                const lastVisit = patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : '-';

                row.onclick = function(e) {
                    if(!e.target.closest('.btn-icon')) window.location.href = '/edit-patient?id=' + patient._id;
                };

                row.innerHTML = `
                    <td>${patientId}</td>
                    <td>${patient.name}</td>
                    <td>${patient.age}</td>
                    <td>${lastVisit}</td>
                    <td class="text-right">
                        <a href="/edit-patient?id=${patient._id}" class="btn-icon edit" title="Edit Patient"><i class="fas fa-edit"></i></a>
                    </td>
                `;
                tbody.appendChild(row);
            });

            document.getElementById('patientCountLabel').innerText = `Total Patients: ${patients.length}`;
        }

        document.addEventListener('DOMContentLoaded', function() {
            loadDoctorInfo();
            loadPatients();
        });

        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#patientTableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });

