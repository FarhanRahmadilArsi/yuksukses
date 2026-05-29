const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'db.json')
  : path.join(__dirname, 'db.json');

const seedData = [
  { nama: 'Andi Prasetyo', email: 'andi.prasetyo@hrsync.id', telepon: '08123456789', jabatan: 'Senior Software Engineer', departemen: 'Engineering', tanggal: '2022-03-15' },
  { nama: 'Siti Rahayu', email: 'siti.rahayu@hrsync.id', telepon: '08234567890', jabatan: 'Product Manager', departemen: 'Product', tanggal: '2021-07-01' },
  { nama: 'Budi Santoso', email: 'budi.santoso@hrsync.id', telepon: '08345678901', jabatan: 'UI/UX Designer', departemen: 'Design', tanggal: '2023-01-10' },
  { nama: 'Dewi Lestari', email: 'dewi.lestari@hrsync.id', telepon: '08456789012', jabatan: 'Marketing Lead', departemen: 'Marketing', tanggal: '2020-11-20' },
  { nama: 'Rizky Firmansyah', email: 'rizky.firmansyah@hrsync.id', telepon: '08567890123', jabatan: 'Sales Executive', departemen: 'Sales', tanggal: '2023-06-05' },
  { nama: 'Nurul Hidayah', email: 'nurul.hidayah@hrsync.id', telepon: '08678901234', jabatan: 'HR Manager', departemen: 'Human Resources', tanggal: '2019-04-12' },
  { nama: 'Fajar Ramadhan', email: 'fajar.ramadhan@hrsync.id', telepon: '08789012345', jabatan: 'Finance Analyst', departemen: 'Finance', tanggal: '2022-08-30' },
  { nama: 'Mega Wulandari', email: 'mega.wulandari@hrsync.id', telepon: '08890123456', jabatan: 'Operations Manager', departemen: 'Operations', tanggal: '2021-02-14' },
  { nama: 'Hendra Wijaya', email: 'hendra.wijaya@hrsync.id', telepon: '08901234567', jabatan: 'Backend Developer', departemen: 'Engineering', tanggal: '2023-09-01' },
  { nama: 'Putri Amelia', email: 'putri.amelia@hrsync.id', telepon: '08112345678', jabatan: 'Customer Success Mgr', departemen: 'Customer Success', tanggal: new Date().toISOString().slice(0, 10) },
  { nama: 'Dimas Kurniawan', email: 'dimas.kurniawan@hrsync.id', telepon: '08223456789', jabatan: 'DevOps Engineer', departemen: 'Engineering', tanggal: '2022-12-01' },
  { nama: 'Ayu Puspita', email: 'ayu.puspita@hrsync.id', telepon: '08334567890', jabatan: 'Legal Counsel', departemen: 'Legal', tanggal: '2020-05-18' },
];

app.use(express.json());
app.use(express.static(path.join(__dirname)));

async function readDb() {
  try {
    const content = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(content || '[]');
  } catch {
    return [];
  }
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function generateId(employees) {
  const year = new Date().getFullYear();
  const seq = String(employees.length + 1).padStart(4, '0');
  return `EMP-${year}-${seq}`;
}

async function ensureSeed() {
  const employees = await readDb();
  if (employees.length === 0) {
    const seeded = seedData.map((item, index) => ({
      id: `EMP-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
      ...item,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
    await writeDb(seeded);
    return seeded;
  }
  return employees;
}

app.get('/api/employees', async (req, res) => {
  const employees = await ensureSeed();
  res.json(employees);
});

app.post('/api/employees', async (req, res) => {
  const employees = await readDb();
  const payload = req.body;
  const newEmployee = {
    id: payload.id || generateId(employees),
    nama: payload.nama,
    email: payload.email,
    telepon: payload.telepon,
    tanggal: payload.tanggal,
    jabatan: payload.jabatan,
    departemen: payload.departemen,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  employees.push(newEmployee);
  await writeDb(employees);
  res.status(201).json(newEmployee);
});

app.put('/api/employees/:id', async (req, res) => {
  const id = req.params.id;
  const employees = await readDb();
  const index = employees.findIndex((emp) => emp.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
  }

  employees[index] = {
    ...employees[index],
    ...req.body,
    id,
    updatedAt: Date.now(),
  };

  await writeDb(employees);
  res.json(employees[index]);
});

app.delete('/api/employees/:id', async (req, res) => {
  const id = req.params.id;
  let employees = await readDb();
  const exists = employees.some((emp) => emp.id === id);
  if (!exists) {
    return res.status(404).json({ error: 'Karyawan tidak ditemukan' });
  }

  employees = employees.filter((emp) => emp.id !== id);
  await writeDb(employees);
  res.status(204).send();
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
