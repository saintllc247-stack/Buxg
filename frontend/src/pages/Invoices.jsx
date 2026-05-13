import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Select, MenuItem, FormControl, InputLabel, Typography, IconButton, Chip, Stack, Divider,
  Snackbar, Alert,
} from '@mui/material'
import { Add, Delete, Visibility, Send, Check, Download, Email } from '@mui/icons-material'
import api from '../api'

const statusColors = { draft: 'default', sent: 'primary', paid: 'success', cancelled: 'error' }
const statusLabels = { draft: 'Черновик', sent: 'Отправлен', paid: 'Оплачен', cancelled: 'Отменён' }

export default function Invoices() {
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
      setSnackbar({ open: true, message: 'Счёт отправлен клиенту', severity: 'success' })
      loadInvoices()
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.detail || 'Ошибка отправки', severity: 'error' })
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Удалить счёт?')) {
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
      alert(err.response?.data?.detail || 'Ошибка экспорта')
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
      alert(err.response?.data?.detail || 'Ошибка скачивания')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Счета</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Download />} onClick={downloadExcel}>
            Excel
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Выставить счёт
          </Button>
        </Stack>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>№ счёта</TableCell>
                  <TableCell>Клиент</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Сумма</TableCell>
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
                      <TableCell><Chip label={statusLabels[inv.status]} color={statusColors[inv.status]} size="small" /></TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{inv.total_amount.toLocaleString()} сум</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => viewInvoice(inv)} title="Просмотр"><Visibility fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleSendEmail(inv)} title="Отправить по email"><Email fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => downloadInvoiceXlsx(inv)} title="Скачать"><Download fontSize="small" /></IconButton>
                          {inv.status === 'draft' && (
                            <>
                              <IconButton size="small" onClick={() => updateStatus(inv.id, 'sent')} title="Отметить отправленным"><Send fontSize="small" /></IconButton>
                              <IconButton size="small" onClick={() => updateStatus(inv.id, 'paid')} title="Отметить оплаченным"><Check fontSize="small" /></IconButton>
                            </>
                          )}
                          <IconButton size="small" onClick={() => handleDelete(inv.id)} title="Удалить"><Delete fontSize="small" /></IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Нет счетов</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Новый счёт</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Клиент</InputLabel>
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} label="Клиент" required>
              {clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField label="Дата выписки" type="date" fullWidth margin="normal" required
              value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            <TextField label="Срок оплаты" type="date" fullWidth margin="normal" required
              value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </Stack>
          <TextField label="Примечание" fullWidth margin="normal" multiline rows={2}
            value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>Позиции</Typography>
          {form.items.map((item, i) => (
            <Stack key={i} direction="row" spacing={1} sx={{ mb: 1.5 }} alignItems="center">
              <TextField label="Описание" size="small" sx={{ flex: 2 }}
                value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
              <TextField label="Кол-во" type="number" size="small" sx={{ width: 80 }}
                value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
              <TextField label="Цена" type="number" size="small" sx={{ width: 100 }}
                value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} />
              <Typography sx={{ minWidth: 80, fontWeight: 600 }}>
                {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString()} сум
              </Typography>
              <IconButton size="small" color="error" onClick={() => removeItem(i)}><Delete fontSize="small" /></IconButton>
            </Stack>
          ))}
          <Button onClick={addItem} size="small">+ Добавить позицию</Button>
          <Typography variant="h6" sx={{ mt: 2 }}>Итого: {total.toLocaleString()} сум</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">Отмена</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.client_id || !form.due_date}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Счёт {selected?.invoice_number}</DialogTitle>
        <DialogContent>
          {selected && (() => {
            const client = clients.find(c => c.id === selected.client_id)
            return (
              <Box>
                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Клиент</Typography>
                    <Typography fontWeight={600}>{client?.name || selected.client_id}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Дата</Typography>
                    <Typography>{selected.issue_date} — {selected.due_date}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Статус</Typography>
                    <Chip label={statusLabels[selected.status]} color={statusColors[selected.status]} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Сумма</Typography>
                    <Typography variant="h6" fontWeight={700}>{selected.total_amount.toLocaleString()} сум</Typography>
                  </Box>
                </Stack>
                {selected.notes && (
                  <Typography variant="body2"><strong>Примечание:</strong> {selected.notes}</Typography>
                )}
              </Box>
            )
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewOpen(false)} variant="outlined">Закрыть</Button>
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
