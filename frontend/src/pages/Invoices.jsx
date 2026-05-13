import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Select, MenuItem, FormControl, InputLabel, Typography, IconButton, Chip, Stack, Divider,
  Snackbar, Alert,
} from '@mui/material'
import { Add, Delete, Visibility, Send, Check, Download, Email } from '@mui/icons-material'
import api from '../api'
import { useLang } from '../context/LangContext'

const statusColors = { draft: 'default', sent: 'primary', paid: 'success', cancelled: 'error' }

export default function Invoices() {
  const { t } = useLang()
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [open, setOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ client_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: '', notes: '', items: [{ description: '', quantity: 1, unit_price: 0 }] })

  useEffect(() => {
    api.get('/invoices').then((r) => setInvoices(r.data))
    api.get('/clients').then((r) => setClients(r.data))
  }, [])

  const loadInvoices = () => api.get('/invoices').then((r) => setInvoices(r.data))

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0 }] })
  const updateItem = (i, field, value) => {
    const items = [...form.items]
    items[i][field] = value
    setForm({ ...form, items })
  }
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })
  const total = form.items.reduce((s, item) => s + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)

  const handleSave = async () => {
    const payload = { ...form, client_id: Number(form.client_id) }
    await api.post('/invoices', payload)
    setOpen(false)
    setForm({ client_id: '', issue_date: new Date().toISOString().split('T')[0], due_date: '', notes: '', items: [{ description: '', quantity: 1, unit_price: 0 }] })
    loadInvoices()
  }

  const updateStatus = async (id, status) => {
    await api.patch(`/invoices/${id}/status`, { status })
    loadInvoices()
  }

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const handleSendEmail = async (inv) => {
    try {
      await api.post(`/auth/send-invoice/${inv.id}`)
      setSnackbar({ open: true, message: t('invoiceSent'), severity: 'success' })
      loadInvoices()
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.detail || t('sendError'), severity: 'error' })
    }
  }

  const handleDelete = async (id) => {
    if (confirm(t('deleteInvoiceConfirm'))) {
      await api.delete(`/invoices/${id}`)
      loadInvoices()
    }
  }

  const viewInvoice = (inv) => { setSelected(inv); setViewOpen(true) }

  const downloadExcel = async () => {
    try {
      const response = await api.get('/exports/invoices/excel', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'invoices.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.response?.data?.detail || t('exportError'))
    }
  }

  const downloadInvoiceXlsx = async (inv) => {
    try {
      const response = await api.get(`/exports/invoices/${inv.id}/xlsx`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${inv.invoice_number}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.response?.data?.detail || t('exportError'))
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3, gap: 1.5 }}>
        <Typography variant="h5">{t('invoices')}</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button variant="outlined" startIcon={<Download />} size="small" onClick={downloadExcel}>
            {t('excel')}
          </Button>
          <Button variant="contained" startIcon={<Add />} size="small" onClick={() => setOpen(true)}>
            {t('addInvoice')}
          </Button>
        </Stack>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('invoiceNumber')}</TableCell>
                  <TableCell>{t('client')}</TableCell>
                  <TableCell>{t('date')}</TableCell>
                  <TableCell>{t('status')}</TableCell>
                  <TableCell align="right">{t('total')}</TableCell>
                  <TableCell width={200}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv) => {
                  const client = clients.find(c => c.id === inv.client_id)
                  return (
                    <TableRow key={inv.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{inv.invoice_number}</TableCell>
                      <TableCell>{client?.name || inv.client_id}</TableCell>
                      <TableCell>{inv.issue_date}</TableCell>
                      <TableCell><Chip label={t(inv.status)} color={statusColors[inv.status]} size="small" /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{inv.total_amount.toLocaleString()} {t('currency')}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => viewInvoice(inv)} title={t('view')}><Visibility fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleSendEmail(inv)} title={t('sendEmail')}><Email fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => downloadInvoiceXlsx(inv)} title={t('download')}><Download fontSize="small" /></IconButton>
                          {inv.status === 'draft' && (
                            <>
                              <IconButton size="small" onClick={() => updateStatus(inv.id, 'sent')} title={t('markSent')}><Send fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => updateStatus(inv.id, 'paid')} title={t('markPaid')}><Check fontSize="small" /></IconButton>
                            </>
                          )}
                          <IconButton size="small" onClick={() => handleDelete(inv.id)} title={t('delete')}><Delete fontSize="small" /></IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>{t('noInvoices')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{t('addInvoice')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('client')}</InputLabel>
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} label={t('client')} required>
              {clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label={t('issueDate')} type="date" fullWidth margin="normal" required
              value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            <TextField label={t('dueDate')} type="date" fullWidth margin="normal" required
              value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </Stack>
          <TextField label={t('notes')} fullWidth margin="normal" multiline rows={2}
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>{t('items')}</Typography>
          {form.items.map((item, i) => (
            <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1.5, p: 1, bgcolor: 'grey.50', borderRadius: 1 }} alignItems="center">
              <TextField label={t('description')} size="small" sx={{ flex: 2, width: { xs: '100%', sm: 'auto' } }}
                value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
              <TextField label={t('quantity')} type="number" size="small" sx={{ width: { xs: '100%', sm: 80 } }}
                value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
              <TextField label={t('price')} type="number" size="small" sx={{ width: { xs: '100%', sm: 100 } }}
                value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} />
              <Typography sx={{ minWidth: 80, fontWeight: 600 }}>
                {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString()} {t('currency')}
              </Typography>
              <IconButton size="small" color="error" onClick={() => removeItem(i)}><Delete fontSize="small" /></IconButton>
            </Stack>
          ))}
          <Button onClick={addItem} size="small">{t('addItem')}</Button>
          <Typography variant="h6" sx={{ mt: 2 }}>{t('total')}: {total.toLocaleString()} {t('currency')}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button onClick={() => setOpen(false)} color="inherit" fullWidth>{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.client_id || !form.due_date} fullWidth>{t('save')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{t('invoice')} {selected?.invoice_number}</DialogTitle>
        <DialogContent>
          {selected && (() => {
            const client = clients.find(c => c.id === selected.client_id)
            return (
              <Box>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{t('client')}</Typography>
                    <Typography fontWeight={600}>{client?.name || selected.client_id}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{t('date')}</Typography>
                    <Typography>{selected.issue_date} — {selected.due_date}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{t('status')}</Typography>
                    <Chip label={t(selected.status)} color={statusColors[selected.status]} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{t('total')}</Typography>
                    <Typography variant="h6" fontWeight={700}>{selected.total_amount.toLocaleString()} {t('currency')}</Typography>
                  </Box>
                </Stack>
                {selected.notes && (
                  <Typography variant="body2"><strong>{t('notes')}:</strong> {selected.notes}</Typography>
                )}
              </Box>
            )
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewOpen(false)} variant="outlined">{t('close')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
