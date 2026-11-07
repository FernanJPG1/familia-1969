with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update loadDashboardData to populate barber select
old_load = '''        dashboardState = data;
        if (data.settings) {
          currentSettings = data.settings;
          updateUIWithSettings(data.settings);
        }
        renderMobileView(data);'''

new_load = '''        dashboardState = data;
        if (data.settings) {
          currentSettings = data.settings;
          updateUIWithSettings(data.settings);
        }
        if (data.barbers && Array.isArray(data.barbers)) {
          const barberSelect = document.getElementById('m-new-barber');
          if (barberSelect) {
            const currentVal = barberSelect.value;
            barberSelect.innerHTML = data.barbers.map(b => 
              `<option value="${b.id}">${b.name} (${b.phone || 'WhatsApp'})</option>`
            ).join('');
            if (currentVal) barberSelect.value = currentVal;
          }
        }
        renderMobileView(data);'''

if old_load in text:
    text = text.replace(old_load, new_load)
    print('loadDashboardData updated with barber selector populator!')
else:
    print('old_load not found!')

# 2. Update handleMobileBookingSubmit to send barberId
old_submit = '''      const clientName = document.getElementById('m-new-name').value;
      const clientPhone = document.getElementById('m-new-phone').value;
      const serviceId = document.getElementById('m-new-service').value;
      const time = document.getElementById('m-new-time').value;

      const startTimeISO = new Date(`${selectedDate}T${time}:00`).toISOString();

      try {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            clientName,
            clientPhone,
            startTimeISO,
          }),
        });'''

new_submit = '''      const clientName = document.getElementById('m-new-name').value;
      const clientPhone = document.getElementById('m-new-phone').value;
      const serviceId = document.getElementById('m-new-service').value;
      const time = document.getElementById('m-new-time').value;
      const barberId = document.getElementById('m-new-barber')?.value || undefined;

      const startTimeISO = new Date(`${selectedDate}T${time}:00`).toISOString();

      try {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId,
            clientName,
            clientPhone,
            startTimeISO,
            barberId,
          }),
        });'''

if old_submit in text:
    text = text.replace(old_submit, new_submit)
    print('handleMobileBookingSubmit updated with barberId!')
else:
    print('old_submit not found!')

with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
with open('C:/Users/Usuario/Desktop/Barberia/index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated public/index.html and root index.html with barber selection!')
