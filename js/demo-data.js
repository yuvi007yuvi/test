// Demo data generator for testing the Face Attendance System
// This file can be used to populate the system with sample data

class DemoDataGenerator {
    constructor() {
        this.sampleUsers = [
            {
                name: 'John Doe',
                email: 'john.doe@company.com',
                role: 'employee',
                isActive: true
            },
            {
                name: 'Jane Smith',
                email: 'jane.smith@company.com',
                role: 'manager',
                isActive: true
            },
            {
                name: 'Mike Johnson',
                email: 'mike.johnson@company.com',
                role: 'employee',
                isActive: true
            },
            {
                name: 'Sarah Wilson',
                email: 'sarah.wilson@company.com',
                role: 'admin',
                isActive: true
            },
            {
                name: 'David Brown',
                email: 'david.brown@company.com',
                role: 'employee',
                isActive: true
            }
        ];
    }

    // Generate sample face descriptors (random for demo purposes)
    generateFaceDescriptor() {
        const descriptor = new Float32Array(128);
        for (let i = 0; i < 128; i++) {
            descriptor[i] = Math.random() * 2 - 1; // Random values between -1 and 1
        }
        return Array.from(descriptor);
    }

    // Generate sample attendance records
    generateAttendanceRecords(userId, userName, days = 30) {
        const records = [];
        const today = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Randomly decide if user attended (80% chance)
            if (Math.random() < 0.8) {
                // Random time between 8:00 AM and 10:00 AM
                const hour = 8 + Math.floor(Math.random() * 2);
                const minute = Math.floor(Math.random() * 60);
                const second = Math.floor(Math.random() * 60);
                
                const timestamp = new Date(date);
                timestamp.setHours(hour, minute, second);
                
                records.push({
                    userId: userId,
                    name: userName,
                    email: this.sampleUsers.find(u => u.name === userName)?.email || '',
                    role: this.sampleUsers.find(u => u.name === userName)?.role || 'employee',
                    timestamp: timestamp,
                    status: 'present',
                    confidence: 0.85 + Math.random() * 0.15 // 85-100% confidence
                });
            }
        }
        
        return records;
    }

    // Populate users collection
    async populateUsers() {
        console.log('Generating sample users...');
        
        for (const user of this.sampleUsers) {
            try {
                const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                const userData = {
                    ...user,
                    faceDescriptor: this.generateFaceDescriptor(),
                    createdAt: serverTimestamp(),
                    faceImageUrl: `https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=${user.name.charAt(0)}`
                };
                
                await addDoc(collection(db, 'users'), userData);
                console.log(`✅ Created user: ${user.name}`);
            } catch (error) {
                console.error(`❌ Error creating user ${user.name}:`, error);
            }
        }
    }

    // Populate attendance collection
    async populateAttendance() {
        console.log('Generating sample attendance records...');
        
        // Get all users first
        const { collection, getDocs, addDoc, Timestamp } = await import('firebase/firestore');
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        for (const user of users) {
            try {
                const attendanceRecords = this.generateAttendanceRecords(user.id, user.name);
                
                for (const record of attendanceRecords) {
                    await addDoc(collection(db, 'attendance'), {
                        ...record,
                        timestamp: Timestamp.fromDate(record.timestamp)
                    });
                }
                
                console.log(`✅ Created ${attendanceRecords.length} attendance records for ${user.name}`);
            } catch (error) {
                console.error(`❌ Error creating attendance for ${user.name}:`, error);
            }
        }
    }

    // Clear all data (use with caution!)
    async clearAllData() {
        console.log('⚠️  Clearing all data...');
        
        try {
            const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
            
            // Clear attendance records
            const attendanceSnapshot = await getDocs(collection(db, 'attendance'));
            const attendanceBatch = writeBatch(db);
            attendanceSnapshot.forEach(docSnapshot => {
                attendanceBatch.delete(doc(db, 'attendance', docSnapshot.id));
            });
            await attendanceBatch.commit();
            console.log('✅ Cleared attendance records');
            
            // Clear users
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersBatch = writeBatch(db);
            usersSnapshot.forEach(docSnapshot => {
                usersBatch.delete(doc(db, 'users', docSnapshot.id));
            });
            await usersBatch.commit();
            console.log('✅ Cleared users');
            
        } catch (error) {
            console.error('❌ Error clearing data:', error);
        }
    }

    // Generate complete demo dataset
    async generateDemoData() {
        console.log('🚀 Generating complete demo dataset...');
        
        try {
            await this.populateUsers();
            await this.populateAttendance();
            console.log('🎉 Demo data generation completed!');
            showNotification('Demo data generated successfully!', 'success');
        } catch (error) {
            console.error('❌ Error generating demo data:', error);
            showNotification('Error generating demo data', 'error');
        }
    }

    // Create admin user for testing
    async createAdminUser() {
        try {
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const adminData = {
                name: 'Admin User',
                email: 'admin@company.com',
                role: 'admin',
                faceDescriptor: this.generateFaceDescriptor(),
                createdAt: serverTimestamp(),
                isActive: true,
                faceImageUrl: 'https://via.placeholder.com/300x300/DC2626/FFFFFF?text=A'
            };
            
            await addDoc(collection(db, 'users'), adminData);
            console.log('✅ Created admin user');
            showNotification('Admin user created successfully!', 'success');
        } catch (error) {
            console.error('❌ Error creating admin user:', error);
            showNotification('Error creating admin user', 'error');
        }
    }
}

// Initialize demo data generator
window.demoDataGenerator = new DemoDataGenerator();

// Add demo controls to admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Add demo controls to admin dashboard
    const quickActions = document.querySelector('.bg-white.rounded-xl.shadow-lg.p-6');
    if (quickActions) {
        const demoControls = document.createElement('div');
        demoControls.className = 'mt-4 pt-4 border-t border-gray-200';
        demoControls.innerHTML = `
            <h4 class="text-sm font-medium text-gray-900 mb-3">Demo Data Controls</h4>
            <div class="space-y-2">
                <button id="generateDemoData" class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                    <i class="material-icons mr-2 text-sm">data_usage</i>Generate Demo Data
                </button>
                <button id="createAdminUser" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    <i class="material-icons mr-2 text-sm">admin_panel_settings</i>Create Admin User
                </button>
                <button id="clearAllData" class="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm">
                    <i class="material-icons mr-2 text-sm">delete_forever</i>Clear All Data
                </button>
            </div>
        `;
        quickActions.appendChild(demoControls);

        // Add event listeners
        document.getElementById('generateDemoData')?.addEventListener('click', () => {
            if (confirm('This will generate sample users and attendance data. Continue?')) {
                window.demoDataGenerator.generateDemoData();
            }
        });

        document.getElementById('createAdminUser')?.addEventListener('click', () => {
            if (confirm('This will create an admin user for testing. Continue?')) {
                window.demoDataGenerator.createAdminUser();
            }
        });

        document.getElementById('clearAllData')?.addEventListener('click', () => {
            if (confirm('⚠️ This will delete ALL data from the database. Are you sure?')) {
                if (confirm('This action cannot be undone. Are you absolutely sure?')) {
                    window.demoDataGenerator.clearAllData();
                }
            }
        });
    }
});
