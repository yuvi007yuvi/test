// Admin dashboard functionality

class AdminManager {
    constructor() {
        this.currentUser = null;
        this.attendanceData = [];
        this.usersData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            search: '',
            dateFrom: '',
            dateTo: ''
        };
        this.chart = null;
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuthentication();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
    }

    async checkAuthentication() {
        // Check if user is authenticated
        const { onAuthStateChanged } = await import('firebase/auth');
        
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                this.showLoginModal();
                return;
            }

            // Check if user is admin
            const isAdmin = await this.checkAdminStatus(user);
            if (!isAdmin) {
                showNotification('Access denied. Admin privileges required.', 'error');
                this.showLoginModal();
                return;
            }

            this.currentUser = user;
            this.showDashboard();
        });
    }

    async checkAdminStatus(user) {
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return userData.role === 'admin';
            }
            return false;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Filter controls
        const searchUser = document.getElementById('searchUser');
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const applyFilters = document.getElementById('applyFilters');

        if (searchUser) {
            searchUser.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
            });
        }

        if (dateFrom) {
            dateFrom.addEventListener('change', (e) => {
                this.filters.dateFrom = e.target.value;
            });
        }

        if (dateTo) {
            dateTo.addEventListener('change', (e) => {
                this.filters.dateTo = e.target.value;
            });
        }

        if (applyFilters) {
            applyFilters.addEventListener('click', () => this.applyFilters());
        }

        // Pagination
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');

        if (prevPage) {
            prevPage.addEventListener('click', () => this.previousPage());
        }

        if (nextPage) {
            nextPage.addEventListener('click', () => this.nextPage());
        }

        // Chart controls
        const chart7Days = document.getElementById('chart7Days');
        const chart30Days = document.getElementById('chart30Days');

        if (chart7Days) {
            chart7Days.addEventListener('click', () => this.updateChart(7));
        }

        if (chart30Days) {
            chart30Days.addEventListener('click', () => this.updateChart(30));
        }

        // Export buttons
        const exportExcel = document.getElementById('exportExcel');
        const exportPDF = document.getElementById('exportPDF');
        const refreshData = document.getElementById('refreshData');

        if (exportExcel) {
            exportExcel.addEventListener('click', () => this.exportToExcel());
        }

        if (exportPDF) {
            exportPDF.addEventListener('click', () => this.exportToPDF());
        }

        if (refreshData) {
            refreshData.addEventListener('click', () => this.refreshData());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const errorElement = document.getElementById('loginError');

        try {
            const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');
            const result = await signInWithEmailAndPassword(auth, email, password);
            const isAdmin = await this.checkAdminStatus(result.user);
            
            if (isAdmin) {
                this.currentUser = result.user;
                this.hideLoginModal();
                this.showDashboard();
                showNotification('Login successful', 'success');
            } else {
                await signOut(auth);
                this.showError('Access denied. Admin privileges required.');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(error.message);
        }
    }

    async handleLogout() {
        try {
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
            this.currentUser = null;
            this.showLoginModal();
            showNotification('Logged out successfully', 'info');
        } catch (error) {
            console.error('Logout error:', error);
            showNotification('Logout failed', 'error');
        }
    }

    showError(message) {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    showLoginModal() {
        const modal = document.getElementById('loginModal');
        const dashboard = document.getElementById('dashboardContent');
        
        if (modal) modal.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) modal.classList.add('hidden');
    }

    showDashboard() {
        const modal = document.getElementById('loginModal');
        const dashboard = document.getElementById('dashboardContent');
        
        if (modal) modal.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
    }

    async loadInitialData() {
        await Promise.all([
            this.loadUsers(),
            this.loadAttendanceData(),
            this.updateStats()
        ]);
    }

    async loadUsers() {
        try {
            const { collection, getDocs } = await import('firebase/firestore');
            const usersSnapshot = await getDocs(collection(db, 'users'));
            this.usersData = [];
            
            usersSnapshot.forEach(doc => {
                this.usersData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.updateUsersCount();
        } catch (error) {
            console.error('Error loading users:', error);
            showNotification('Failed to load users', 'error');
        }
    }

    async loadAttendanceData() {
        try {
            const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
            const attendanceQuery = query(
                collection(db, 'attendance'),
                orderBy('timestamp', 'desc'),
                limit(1000)
            );

            const attendanceSnapshot = await getDocs(attendanceQuery);

            this.attendanceData = [];
            attendanceSnapshot.forEach(doc => {
                this.attendanceData.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.updateAttendanceTable();
            this.updateChart();
        } catch (error) {
            console.error('Error loading attendance data:', error);
            showNotification('Failed to load attendance data', 'error');
        }
    }

    async updateStats() {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        // Today's attendance
        const todayAttendance = this.attendanceData.filter(record => {
            const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
            return recordDate >= startOfDay && recordDate < endOfDay;
        });

        // This week's attendance
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekAttendance = this.attendanceData.filter(record => {
            const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
            return recordDate >= weekStart;
        });

        // Update UI
        this.updateElement('totalUsers', this.usersData.length);
        this.updateElement('todayAttendance', todayAttendance.length);
        this.updateElement('weekAttendance', weekAttendance.length);
        
        // Calculate attendance rate
        const activeUsers = this.usersData.filter(user => user.isActive).length;
        const attendanceRate = activeUsers > 0 ? Math.round((todayAttendance.length / activeUsers) * 100) : 0;
        this.updateElement('attendanceRate', `${attendanceRate}%`);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateUsersCount() {
        this.updateElement('totalUsers', this.usersData.length);
    }

    applyFilters() {
        this.currentPage = 1;
        this.updateAttendanceTable();
    }

    getFilteredAttendance() {
        let filtered = [...this.attendanceData];

        // Apply search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(record => 
                record.name.toLowerCase().includes(searchTerm) ||
                record.email.toLowerCase().includes(searchTerm)
            );
        }

        // Apply date filters
        if (this.filters.dateFrom) {
            const fromDate = new Date(this.filters.dateFrom);
            filtered = filtered.filter(record => {
                const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
                return recordDate >= fromDate;
            });
        }

        if (this.filters.dateTo) {
            const toDate = new Date(this.filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(record => {
                const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
                return recordDate <= toDate;
            });
        }

        return filtered;
    }

    updateAttendanceTable() {
        const filteredData = this.getFilteredAttendance();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);

        const tbody = document.getElementById('attendanceTableBody');
        if (!tbody) return;

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No attendance records found</td></tr>';
        } else {
            tbody.innerHTML = pageData.map(record => {
                const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
                return `
                    <tr class="table-row">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${record.name}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(recordDate)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatTime(recordDate)}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="status-badge present">Present</span>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Update pagination info
        this.updatePaginationInfo(filteredData.length);
    }

    updatePaginationInfo(totalRecords) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endIndex = Math.min(this.currentPage * this.itemsPerPage, totalRecords);

        this.updateElement('showingFrom', startIndex);
        this.updateElement('showingTo', endIndex);
        this.updateElement('totalRecords', totalRecords);

        // Update pagination buttons
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (prevBtn) prevBtn.disabled = this.currentPage === 1;
        if (nextBtn) nextBtn.disabled = endIndex >= totalRecords;
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateAttendanceTable();
        }
    }

    nextPage() {
        const filteredData = this.getFilteredAttendance();
        const maxPage = Math.ceil(filteredData.length / this.itemsPerPage);
        
        if (this.currentPage < maxPage) {
            this.currentPage++;
            this.updateAttendanceTable();
        }
    }

    updateChart(days = 7) {
        const ctx = document.getElementById('attendanceChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.chart) {
            this.chart.destroy();
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        // Group attendance by date
        const attendanceByDate = {};
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDate(d);
            attendanceByDate[dateStr] = 0;
        }

        this.attendanceData.forEach(record => {
            const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
            if (recordDate >= startDate && recordDate <= endDate) {
                const dateStr = formatDate(recordDate);
                if (attendanceByDate[dateStr] !== undefined) {
                    attendanceByDate[dateStr]++;
                }
            }
        });

        const labels = Object.keys(attendanceByDate);
        const data = Object.values(attendanceByDate);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Attendance',
                    data: data,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    exportToExcel() {
        try {
            const filteredData = this.getFilteredAttendance();
            const worksheet = XLSX.utils.json_to_sheet(
                filteredData.map(record => {
                    const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
                    return {
                        Name: record.name,
                        Email: record.email,
                        Date: formatDate(recordDate),
                        Time: formatTime(recordDate),
                        Status: 'Present'
                    };
                })
            );
            
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
            
            const fileName = `attendance_${formatDate(new Date()).replace(/\s/g, '_')}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            
            showNotification('Excel file exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showNotification('Export failed', 'error');
        }
    }

    exportToPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Add title
            doc.setFontSize(20);
            doc.text('Attendance Report', 20, 20);
            
            // Add date
            doc.setFontSize(12);
            doc.text(`Generated on: ${formatDateTime(new Date())}`, 20, 30);
            
            // Add table
            const filteredData = this.getFilteredAttendance();
            const tableData = filteredData.slice(0, 50).map(record => {
                const recordDate = record.timestamp.toDate ? record.timestamp.toDate() : new Date(record.timestamp);
                return [
                    record.name,
                    record.email,
                    formatDate(recordDate),
                    formatTime(recordDate),
                    'Present'
                ];
            });
            
            doc.autoTable({
                head: [['Name', 'Email', 'Date', 'Time', 'Status']],
                body: tableData,
                startY: 40
            });
            
            const fileName = `attendance_${formatDate(new Date()).replace(/\s/g, '_')}.pdf`;
            doc.save(fileName);
            
            showNotification('PDF file exported successfully', 'success');
        } catch (error) {
            console.error('PDF export error:', error);
            showNotification('PDF export failed', 'error');
        }
    }

    async refreshData() {
        showNotification('Refreshing data...', 'info');
        await this.loadInitialData();
        showNotification('Data refreshed successfully', 'success');
    }
}

// Initialize admin manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});
