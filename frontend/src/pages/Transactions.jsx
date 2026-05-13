import { useState, useEffect } from 'react'
import {
  Box, Button, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Select, MenuItem, FormControl, InputLabel, Typography, IconButton, Chip, Stack, Checkbox,
  Snackbar, Alert, Tooltip,
} from '@mui/material'
import { Add, Edit, Delete, Search, Download, Upload, Clear } from '@mui/icons-material'
import api from '../api'
import { useLang } from '../context/LangContext'

export default function Transactions() {
  const { t } = useLang()
  const [txns, setTxns] = useState([])
  const [categories, setCategories] = useState([])
  const [clients, setClients] = useState([])
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const [filter, setFilter] = useState({ type: '', search: '' })
  const [importOpen, setImportOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [form, setForm] = useState({ type: 'income', amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0], client_id: '' })

  const showMsg = (message, severity = 'success') => setSnackbar({ open: true, message, severity })

  const load = () => api.get('/transactions').then((r) => setTxns(r.data))
  const loadCats = () => api.get('/categories').then((r) => setCategories(r.data))
  const loadClients = () => api.get('/clients').then((r) => setClients(r.data))

  useEffect(() => { load(); loadCats(); loadClients() }, [])

  const handleSave = async () => {
    const payload = { ...form, amount: parseFloat(form.amount), category_id: form.category_id ? Number(form.category_id) : null, client_id: form.client_id ? Number(form.client_id) : null }
    if (!payload.amount || payload.amount <= 0) {
      showMsg(t('amountError'), 'error')
      return
    }
    try {
      if (edit) await api.put(`/transactions/${edit.id}`, payload)
      else await api.post('/transactions', payload)
      setOpen(false); setEdit(null); load()
      showMsg(edit ? t('transactionUpdated') : t('transactionAdded'))
    } catch (err) {
      showMsg(err.response?.data?.detail || t('saveError'), 'error')
    }
  }

  const handleDelete = async (id) => {
    if (confirm(t('deleteConfirm'))) {
      try {
        await api.delete(`/transactions/${id}`)
        load()
        showMsg(t('transactionDeleted'))
      } catch (err) {
        showMsg(err.response?.data?.detail || t('deleteError'), 'error')
      }
    }
  }

  const openEdit = (t) => {
    setEdit(t)
    setForm({ type: t.type, amount: String(t.amount), category_id: t.category_id || '', description: t.description, date: t.date, client_id: t.client_id || '' })
    setOpen(true)
  }

  const downloadExcel = async () => {
    try {
      const response = await api.get('/exports/transactions/excel', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transactions.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      showMsg(err.response?.data?.detail || t('exportError'), 'error')
    }
  }

  const filtered = txns.filter(t => {
    if (filter.type && t.type !== filter.type) return false
    if (filter.search) {
      const q = filter.search.toLowerCase()
      const catName = categories.find(c => c.id === t.category_id)?.name || ''
      const clientName = clients.find(c => c.id === t.client_id)?.name || ''
      if (!t.description?.toLowerCase().includes(q) && !catName.toLowerCase().includes(q) && !clientName.toLowerCase().includes(q)) return false
    }
    return true
  })

  const filteredIds = filtered.map(t => t.id)
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id))

  const toggleSelect = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set([...selected].filter(id => !filteredIds.includes(id))))
    } else {
      const next = new Set(selected)
      filteredIds.forEach(id => next.add(id))
      setSelected(next)
    }
  }

  const handleBulkDelete = async () => {
    const ids = [...selected]
    try {
      await api.post('/transactions/bulk-delete', { ids })
      setSelected(new Set())
      setConfirmBulkDelete(false)
      load()
      showMsg(`Удалено ${ids.length} транзакций`)
    } catch (err) {
      showMsg(err.response?.data?.detail || t('saveError'), 'error')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 3, gap: 1.5 }}>
        <Typography variant="h5">{t('transactions')}</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {selected.size > 0 && (
            <Button color="error" variant="outlined" startIcon={<Delete />} size="small" onClick={() => setConfirmBulkDelete(true)}>
              {t('deleteSelected')} ({selected.size})
            </Button>
          )}
          <Button variant="outlined" startIcon={<Upload />} size="small" onClick={() => setImportOpen(true)}>
            {t('importCsv')}
          </Button>
          <Tooltip title={t('clearImportConfirm')}>
            <Button variant="outlined" color="error" startIcon={<Clear />} size="small" onClick={() => setConfirmClear(true)}>
              {t('clearImport')}
            </Button>
          </Tooltip>
          <Button variant="outlined" startIcon={<Download />} size="small" onClick={downloadExcel}>
            {t('excel')}
          </Button>
          <Button variant="contained" startIcon={<Add />} size="small"
            onClick={() => { setEdit(null); setForm({ type: 'income', amount: '', category_id: '', description: '', date: new Date().toISOString().split('T')[0], client_id: '' }); setOpen(true) }}>
            {t('addTransaction')}
          </Button>
        </Stack>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('type')}</InputLabel>
          <Select value={filter.type} label={t('type')} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
            <MenuItem value="">{t('all')}</MenuItem>
            <MenuItem value="income">{t('incomes')}</MenuItem>
            <MenuItem value="expense">{t('expenses')}</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" placeholder={t('search')} value={filter.search}
          onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          slotProps={{ input: { startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} /> } }} />
        {(filter.type || filter.search) && (
          <Button size="small" onClick={() => setFilter({ type: '', search: '' })}>{t('reset')}</Button>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: 'auto' }, mt: { xs: -1, sm: 0 } }}>
          {filtered.length} {t('of')} {txns.length}
        </Typography>
      </Stack>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Checkbox checked={allSelected} indeterminate={selected.size > 0 && !allSelected} onChange={toggleSelectAll} />
                  </TableCell>
                  <TableCell>{t('date')}</TableCell>
                  <TableCell>{t('type')}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('category')}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('client')}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('description')}</TableCell>
                  <TableCell align="right">{t('amount')}</TableCell>
                  <TableCell width={80}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((txn) => {
                  const catName = categories.find(c => c.id === txn.category_id)?.name
                  const clientName = clients.find(c => c.id === txn.client_id)?.name
                  return (
                    <TableRow key={txn.id} hover selected={selected.has(txn.id)}>
                      <TableCell padding="checkbox" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Checkbox checked={selected.has(txn.id)} onChange={() => toggleSelect(txn.id)} />
                      </TableCell>
                      <TableCell>{txn.date}</TableCell>
                      <TableCell>
                        <Typography color={txn.type === 'income' ? 'success.main' : 'error.main'} fontWeight={600}>
                          {txn.type === 'income' ? t('income') : t('expense')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><Chip label={catName || '-'} size="small" variant="outlined" /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{clientName || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{txn.description || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{txn.amount.toLocaleString()} {t('currency')}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => openEdit(txn)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => handleDelete(txn.id)}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}>{t('noTransactions')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{t('importTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('importDesc')}
          </Typography>
          <Button variant="contained" component="label">
            {t('chooseFile')}
            <input type="file" accept=".csv,.xlsx" hidden onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const formData = new FormData()
              formData.append('file', file)
              try {
                const r = await api.post('/exports/transactions/import', formData)
                setImportOpen(false)
                load()
                showMsg(`${t('importSuccess')} ${r.data.imported} ${t('importedTransactions')}`)
              } catch (err) {
                showMsg(err.response?.data?.detail || t('exportError'), 'error')
              }
            }} />
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setImportOpen(false)} color="inherit">{t('close')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmBulkDelete} onClose={() => setConfirmBulkDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('deleteSelected')}</DialogTitle>
        <DialogContent>
          <Typography>{t('bulkDeleteConfirm')} {selected.size} {t('transactionsWord')}.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmBulkDelete(false)} color="inherit">{t('cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleBulkDelete}>{t('deleteSelected')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('clearImportTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('clearImportConfirm')}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmClear(false)} color="inherit">{t('cancel')}</Button>
          <Button color="error" variant="contained" onClick={async () => {
            try {
              const r = await api.delete('/transactions/imported/clear')
              setConfirmClear(false)
              load()
              showMsg(`${t('clearSuccess')} ${r.data.deleted} ${t('importedDeleted')}`)
            } catch (err) {
              showMsg(err.response?.data?.detail || 'Ошибка', 'error')
            }
          }}>Удалить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>{edit ? t('editTransaction') : t('newTransaction')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('type')}</InputLabel>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category_id: '' })} label={t('type')}>
              <MenuItem value="income">{t('income')}</MenuItem>
              <MenuItem value="expense">{t('expense')}</MenuItem>
            </Select>
          </FormControl>
          <TextField label={t('amount')} type="number" fullWidth margin="normal" required autoFocus
            slotProps={{ htmlInput: { min: 0, step: 'any' } }}
            value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('category')}</InputLabel>
            <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} label={t('category')}>
              <MenuItem value="">—</MenuItem>
              {categories.filter(c => c.type === form.type).map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('client')}</InputLabel>
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} label={t('client')}>
              <MenuItem value="">—</MenuItem>
              {clients.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
            </Select>
          </FormControl>
          <TextField label={t('description')} fullWidth margin="normal" multiline rows={2}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label={t('date')} type="date" fullWidth margin="normal" required
            value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit">{t('cancel')}</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={!form.amount || !form.date}>
            {t('save')}
          </Button>
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

