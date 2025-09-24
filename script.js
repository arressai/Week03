  // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('day', 'other-month');
            this.calendarDaysEl.appendChild(dayEl);
        }

        // Add days of the current month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('day', 'current-month');
            dayEl.textContent = day;
            
            const currentDay = new Date(year, month, day);
            
            // Highlight today
            if (this.isSameDay(currentDay, today)) {
                dayEl.classList.add('today');
            }
            
            // Highlight selected day
            if (this.selectedDate && this.isSameDay(currentDay, this.selectedDate)) {
                dayEl.classList.add('selected');
            }
            
            // Add click event for date selection
            dayEl.addEventListener('click', () => this.selectDate(currentDay));
            
            this.calendarDaysEl.appendChild(dayEl);
        }
    

    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar(); // Re-render to show selection
        
        // Update selected date display
        this.selectedDateEl.textContent = new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
        
        this.validateForm();
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    validateForm() {
        const isValid = this.selectedDate && 
                       this.titleInput.value.trim() && 
                       this.startTimeInput.value && 
                       this.endTimeInput.value &&
                       this.yourEmailInput.value.trim() &&
                       this.attendeeEmailInput.value.trim() &&
                       this.isValidEmail(this.yourEmailInput.value.trim()) &&
                       this.isValidEmail(this.attendeeEmailInput.value.trim());
        
        this.createAppointmentBtn.disabled = !isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    createAppointment() {
        if (!this.selectedDate) {
            alert('Please select a date first.');
            return;
        }
        
        // Create start and end datetime objects
        const startDateTime = new Date(this.selectedDate);
        const endDateTime = new Date(this.selectedDate);
        
        // Parse and set times
        const [startHour, startMin] = this.startTimeInput.value.split(':');
        const [endHour, endMin] = this.endTimeInput.value.split(':');
        
        startDateTime.setHours(parseInt(startHour), parseInt(startMin));
        endDateTime.setHours(parseInt(endHour), parseInt(endMin));
        
        // Validate end time is after start time
        if (endDateTime <= startDateTime) {
            alert('End time must be after start time.');
            return;
        }
        
        // Store appointment data
        this.appointmentData = {
            title: this.titleInput.value.trim(),
            startDate: startDateTime,
            endDate: endDateTime,
            yourEmail: this.yourEmailInput.value.trim(),
            attendeeEmail: this.attendeeEmailInput.value.trim()
        };
        
        alert('Appointment created successfully! Use the calendar options below to add to your calendar.');
    }

    openGoogleCalendar() {
        if (!this.appointmentData.startDate) {
            alert('Please create an appointment first.');
            return;
        }
        
        const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
        const params = new URLSearchParams({
            text: this.appointmentData.title,
            dates: `${this.formatGoogleDate(this.appointmentData.startDate)}/${this.formatGoogleDate(this.appointmentData.endDate)}`,
            details: `Appointment: ${this.appointmentData.yourEmail} with loved one ${this.appointmentData.attendeeEmail}`
        });
        
        window.open(`${baseUrl}&${params.toString()}`, '_blank');
    }

    openOutlookCalendar() {
        if (!this.appointmentData.startDate) {
            alert('Please create an appointment first.');
            return;
        }
        
        const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
        const params = new URLSearchParams({
            subject: this.appointmentData.title,
            startdt: this.appointmentData.startDate.toISOString(),
            enddt: this.appointmentData.endDate.toISOString(),
            body: `Appointment: ${this.appointmentData.yourEmail} with loved one ${this.appointmentData.attendeeEmail}`
        });
        
        window.open(`${baseUrl}&${params.toString()}`, '_blank');
    }

    downloadICS() {
        if (!this.appointmentData.startDate) {
            alert('Please create an appointment first.');
            return;
        }
        
        const icsContent = this.generateICSFile();
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.appointmentData.title || 'appointment'}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    generateICSFile() {
        return [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Calendar App//Appointment Scheduler//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@calendarapp.com`,
            `DTSTAMP:${this.formatGoogleDate(new Date())}`,
            `DTSTART:${this.formatGoogleDate(this.appointmentData.startDate)}`,
            `DTEND:${this.formatGoogleDate(this.appointmentData.endDate)}`,
            `SUMMARY:${this.escapeICSText(this.appointmentData.title)}`,
            `DESCRIPTION:Appointment: ${this.appointmentData.yourEmail} with loved one ${this.appointmentData.attendeeEmail}`,
            `ATTENDEE;RSVP=TRUE;CN=${this.appointmentData.attendeeEmail}:MAILTO:${this.appointmentData.attendeeEmail}`,
            `ORGANIZER;CN=${this.appointmentData.yourEmail}:MAILTO:${this.appointmentData.yourEmail}`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');
    }

    formatGoogleDate(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    escapeICSText(text) {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '');
    }
}

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CalendarAppointmentInterface();
});