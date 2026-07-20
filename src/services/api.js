const API_BASE = '/api'

let tokenGetter = async () => null
let unauthorizedHandler = null

export function setTokenGetter(getter) {
  tokenGetter = getter
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

async function request(path, options = {}) {
  const token = await tokenGetter()

  if (!token) {
    unauthorizedHandler?.()
    throw new Error('Unauthorized — please sign in')
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
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
    if (response.status === 401) {
      unauthorizedHandler?.()
      throw new Error(data?.error || 'Unauthorized — please sign in again')
    }
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

export async function migrateLegacyData() {
  return request('/migrateLegacyData', { method: 'POST' })
}

export async function resetSeason() {
  return request('/resetSeason', { method: 'POST' })
}

export async function deleteSeason(seasonId) {
  return request(`/deleteSeason?seasonId=${encodeURIComponent(seasonId)}`, {
    method: 'DELETE',
  })
}
