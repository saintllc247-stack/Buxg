import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Typography, IconButton, Stack, Checkbox, Snackbar, Alert,
} from '@mui/material'
import { Add, Edit, Delete, Download } from '@mui/icons-material'
import api from '../api'
import { useLang } from '../context/LangContext'

export default function Clients() {
  const { t } = useLang()
  const [clients, setClients] = useState([])
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', tin: '' })
  const [selected, setSelected] = useState(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const showMsg = (message, severity = 'success') => setSnackbar({ open: true, message, severity })

  const load = () => api.get('/clients').then((r) => setClients(r.data))

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (edit) await api.put(`/clients/${edit.id}`, form)
    else await api.post('/clients', form)
    setOpen(false); setEdit(null)
    load()
  }

  const handleDelete = async (id) => {
    if (confirm(t('deleteClientConfirm'))) {
      await api.delete(`/clients/${id}`)
      setSelected(new Set([...selected].filter(s => s !== id)))
      load()
    }
  }

  const toggleSelect = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(clients.map(c => c.id)))
  }

  const allSelected = clients.length > 0 && clients.every(c => selected.has(c.id))

  const handleBulkDelete = async () => {
    const ids = [...selected]
    try {
      await api.post('/clients/bulk-delete', { ids })
      setSelected(new Set())
      setConfirmBulkDelete(false)
      load()
      showMsg(`${t('bulkDeleteConfirm')} ${ids.length} ${t('clients')}`)
    } catch (err) {
      showMsg(err.response?.data?.detail || t('deleteError'), 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3, gap: 1.5 }}>
        <Typography variant="h5">{t('clients')}</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {selected.size > 0 && (
            <Button color="error" variant="outlined" startIcon={<Delete />} size="small" onClick={() => setConfirmBulkDelete(true)}>
              {t('deleteSelected')} ({selected.size})
            </Button>
          )}
          <Button variant="outlined" startIcon={<Download />} size="small"
            onClick={() => window.open('/api/exports/clients/excel', '_blank')}>
            {t('excel')}
          </Button>
          <Button variant="contained" startIcon={<Add />} size="small"
            onClick={() => { setEdit(null); setForm({ name: '', email: '', phone: '', address: '', tin: '' }); setOpen(true) }}>
            {t('addClient')}
          </Button>
        </Stack>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Checkbox checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onChange={toggleSelectAll} />
                  </TableCell>
                  <TableCell>{t('name')}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('email')}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('phone')}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('tin')}</TableCell>
                  <TableCell width={80}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id} hover selected={selected.has(c.id)}>
                    <TableCell padding="checkbox" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Checkbox checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} />
                    </TableCell>
                    <TableCell fontWeight={600}>{c.name}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{c.email || '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{c.phone || '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{c.tin || '-'}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setEdit(c); setForm(c); setOpen(true) }}><Edit fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(c.id)}><Delete fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {clients.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>{t('noClients')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('deleteSelected')}</DialogTitle>
        <DialogContent>
          <Typography>{t('bulkDeleteConfirm')} {selected.size} {t('clients')}.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmBulkDelete(false)} color="inherit">{t('cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>{t('delete')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{edit ? t('editClient') : t('newClient')}</DialogTitle>
        <DialogContent>
          <TextField label={t('name')} fullWidth margin="normal" required autoFocus
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label={t('email')} fullWidth margin="normal"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label={t('phone')} fullWidth margin="normal"
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label={t('address')} fullWidth margin="normal" multiline rows={2}
            value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <TextField label={t('tin')} fullWidth margin="normal"
            value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('save')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
