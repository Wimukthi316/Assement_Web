const API_BASE = '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  let data = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = { error: text }
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`)
  }

  return data
}

export async function fetchAssignments() {
  return request('/getAssignments')
}

export async function createAssignment(assignment) {
  return request('/createAssignment', {
    method: 'POST',
    body: JSON.stringify(assignment),
  })
}

export async function updateAssignment(assignment) {
  return request('/updateAssignment', {
    method: 'PUT',
    body: JSON.stringify(assignment),
  })
}

export async function deleteAssignment(id) {
  return request(`/deleteAssignment?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export async function importAssignments(assignments) {
  return request('/importAssignments', {
    method: 'POST',
    body: JSON.stringify({ assignments }),
  })
}
