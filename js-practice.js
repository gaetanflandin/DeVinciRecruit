import { doctors as hospitalDoctors, addDoctor } from './hospitalData.js'

// 2.1 Variables and Data Types
const hospitalName = 'Central Hospital'
let numberOfDoctors = 12
let isOpen = true

console.log('\n2.1 Variables and Data Types')
console.log(`Welcome to ${hospitalName}! We have ${numberOfDoctors} doctors currently available.`)
console.log('Hospital open:', isOpen)
isOpen = false
if (!isOpen) {
  numberOfDoctors = 0
  console.log(`${hospitalName} is closed. ${numberOfDoctors} doctors are currently available.`)
}

// 2.2 Working with Arrays and Loops
console.log('\n2.2 Working with Arrays and Loops')
const doctors = ['Dr. Lee', 'Dr. Khan', 'Dr. Martin', 'Dr. Garcia', 'Dr. Chen']
let doctorNumber = 1
for (const doctor of doctors) {
  console.log(`Doctor #${doctorNumber}: ${doctor}`)
  doctorNumber += 1
}

doctors.push('Dr. Wilson')
console.log('Updated doctor count:', doctors.length)

function findDoctor (name) {
  return doctors.includes(name) ? 'Doctor found' : 'Doctor not found'
}

console.log('Dr. Lee:', findDoctor('Dr. Lee'))
console.log('Dr. Smith:', findDoctor('Dr. Smith'))

// 2.3 Objects and Nested Data
console.log('\n2.3 Objects and Nested Data')
const patient = {
  name: 'Alice Martin',
  age: 34,
  conditions: ['diabetes', 'hypertension'],
  doctor: { name: 'Dr. Lee', specialty: 'Cardiology' }
}

console.log('Doctor name:', patient.doctor.name)
console.log('Number of conditions:', patient.conditions.length)
console.log(`${patient.name} is treated by ${patient.doctor.name} (${patient.doctor.specialty}).`)
patient.conditions.push('anxiety')
console.log('Updated patient:', patient)

// 2.4 Functions and Array Filtering
console.log('\n2.4 Functions and Array Filtering')
const patients = [
  { id: 1, name: 'Alice', age: 34 },
  { id: 2, name: 'John', age: 45 },
  { id: 3, name: 'Marie', age: 29 }
]

function filterByAge (minAge) {
  // Keep only patients strictly older than the minimum age.
  return patients.filter(patient => patient.age > minAge)
}

function addPatient (name, age) {
  const newPatient = { id: patients.length + 1, name, age }
  patients.push(newPatient)
}

console.log('Patients older than 34:', filterByAge(34))
addPatient('Sam', 38)
console.log('Updated patients:', patients)

// 2.5 Modularization: the shared array and function come from hospitalData.js.
console.log('\n2.5 Modularization')
addDoctor('Dr. Garcia')
console.log('Updated doctors from the module:', hospitalDoctors)
// Run node main.js to see the separate module entry point.

// 2.6 Error Handling and Validation
console.log('\n2.6 Error Handling and Validation')
function createAppointment (doctor, patient, date) {
  if (!doctor || !patient || !date) {
    throw new Error('Missing required fields')
  }
  return { doctor, patient, date }
}

try {
  console.log('Valid appointment:', createAppointment('Dr. Lee', 'Alice', '2026-11-15'))
  // Missing patient and date deliberately demonstrate the error handler.
  console.log(createAppointment('Dr. Lee'))
} catch (err) {
  console.error('Error:', err.message)
}

// 2.7 Asynchronous Code
console.log('\n2.7 Asynchronous Code')
function getHospitalData () {
  // Simulate a database taking one second to return its data.
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ name: hospitalName, uptime: 1234 })
    }, 1000)
  })
}

async function showData () {
  console.log('Fetching hospital data...')
  const data = await getHospitalData()
  console.log('Data loaded:', data)
}

showData().catch(err => {
  console.error('Could not load hospital data:', err.message)
  process.exitCode = 1
})
