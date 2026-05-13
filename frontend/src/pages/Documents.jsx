import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, IconButton, Checkbox, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, Stack, LinearProgress,
} from '@mui/material'
import { Delete, Download, Upload, InsertDriveFile, Description, Image, PictureAsPdf } from '@mui/icons-material'
import api from '../api'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fileIcon(mime) {
  if (mime?.startsWith('image/')) return <Image color="success" />
  if (mime === 'application/pdf') return <PictureAsPdf color="error" />
  return <InsertDriveFile color="primary" />
}

export default function Documents() {
  const [docs, setDocs] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [uploading, setUploading] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const load = () => api.get('/documents').then((r) => setDocs(r.data))

  useEffect(() => { load() }, [])

  const handleUpload = async (e) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        await api.post('/documents/upload', fd)
      } catch (err) {
        alert(err.response?.data?.detail || 'Ошибка загрузки')
      }
    }
    setUploading(false)
    load()
    e.target.value = ''
  }

  const handleDelete = async (id) => {
    if (confirm('Удалить файл?')) {
      await api.delete(`/documents/${id}`)
      setSelected(new Set([...selected].filter(s => s !== id)))
      load()
    }
  }

  const handleBulkDelete = async () => {
    const ids = [...selected]
    try {
      await api.post('/documents/bulk-delete', { ids })
      setSelected(new Set())
      setConfirmBulkDelete(false)
      load()
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка')
    }
  }

  const toggleSelect = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const allSelected = docs.length > 0 && docs.every(d => selected.has(d.id))

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5">Файлы и документы</Typography>
        <Stack direction="row" spacing={1}>
          {selected.size > 0 && (
            <Button color="error" variant="outlined" startIcon={<Delete />} onClick={() => setConfirmBulkDelete(true)}>
              Удалить ({selected.size})
            </Button>
          )}
          <Button variant="contained" component="label" startIcon={<Upload />} disabled={uploading}>
            {uploading ? 'Загрузка...' : 'Загрузить'}
            <input type="file" multiple hidden onChange={handleUpload} />
          </Button>
        </Stack>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      {docs.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <InsertDriveFile sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">Нет загруженных файлов</Typography>
            <Typography variant="body2" color="text.disabled">Нажмите «Загрузить», чтобы добавить файлы</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox checked={allSelected} indeterminate={selected.size > 0 && !allSelected}
                        onChange={() => { if (allSelected) setSelected(new Set()); else setSelected(new Set(docs.map(d => d.id))) }} />
                    </TableCell>
                    <TableCell>Файл</TableCell>
                    <TableCell>Размер</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Дата</TableCell>
                    <TableCell width={120}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d.id} hover selected={selected.has(d.id)}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={selected.has(d.id)} onChange={() => toggleSelect(d.id)} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          {fileIcon(d.mime_type)}
                          <Typography fontWeight={500} noWrap sx={{ maxWidth: 300 }}>{d.original_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{formatSize(d.file_size)}</TableCell>
                      <TableCell><Chip label={d.mime_type || 'unknown'} size="small" variant="outlined" /></TableCell>
                      <TableCell>{formatDate(d.created_at)}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => window.open(`/api/documents/${d.id}`, '_blank')}><Download fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(d.id)}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} maxWidth="xs">
        <DialogTitle>Удалить выбранные файлы?</DialogTitle>
        <DialogContent>
          <Typography>Будет удалено {selected.size} файл{selected.size === 1 ? '' : selected.size >= 2 && selected.size <= 4 ? 'а' : 'ов'}.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmBulkDelete(false)} color="inherit">Отмена</Button>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
