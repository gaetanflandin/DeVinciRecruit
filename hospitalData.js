// Export shared data and a function that updates it.
export const doctors = ['Dr. Lee', 'Dr. Khan']

export function addDoctor (name) {
  doctors.push(name)
}
