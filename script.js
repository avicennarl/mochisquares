const MAX_POPULATIONS = 3;
let populationCount = 0;

// Fungsi untuk membuat formulir populasi
function createPopulationForm(populationId) {
    const container = document.createElement('div');
    container.className = 'kontainer-populasi';
    container.id = `populasi-${populationId}`;

    const title = document.createElement('h3');
    title.innerText = `Populasi ${populationId}`;
    container.appendChild(title);

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Pengukuran Data</th>
            <th>Aksi</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.id = `tabel-data-${populationId}`;
    table.appendChild(tbody);

    const addDataBtn = document.createElement('button');
    addDataBtn.className = 'add-data-btn';
    addDataBtn.innerText = 'Tambah Data';
    addDataBtn.onclick = () => addDataRow(populationId);

    const deletePopulationBtn = document.createElement('button');
    deletePopulationBtn.className = 'hapus-populasi';
    deletePopulationBtn.innerText = 'Hapus Populasi';
    deletePopulationBtn.onclick = () => removePopulation(populationId);

    container.appendChild(table);
    container.appendChild(addDataBtn);
    container.appendChild(deletePopulationBtn);

    return container;
}

// Fungsi untuk menambahkan baris data ke tabel populasi
function addDataRow(populationId) {
    const tbody = document.getElementById(`tabel-data-${populationId}`);
    const row = document.createElement('tr');

    const dataCell = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.step = 'any'; // Mendukung angka desimal
    input.placeholder = 'Masukkan Nilai';
    input.required = true;
    dataCell.appendChild(input);

    const actionCell = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Hapus Data';
    deleteBtn.onclick = () => tbody.removeChild(row);
    actionCell.appendChild(deleteBtn);

    row.appendChild(dataCell);
    row.appendChild(actionCell);
    tbody.appendChild(row);
}

// Fungsi untuk menghapus formulir populasi
function removePopulation(populationId) {
    const container = document.getElementById(`populasi-${populationId}`);
    if (container) {
        container.remove();
        populationCount--;
    }
}

// Fungsi untuk menghitung variansi
function calculateVariance(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
}

// Fungsi untuk menghitung variansi gabungan, faktor koreksi, dan Chi-Square
function calculateChiSquare(populations) {
    const k = populations.length;
    let totalDegreesOfFreedom = 0;
    let combinedVarianceNumerator = 0;
    let logSum = 0;

    const degreesOfFreedom = [];
    const variances = [];

    // Hitung derajat kebebasan dan variansi untuk setiap populasi
    populations.forEach(data => {
        const n = data.length;
        const variance = calculateVariance(data);
        const df = n - 1;

        degreesOfFreedom.push(df);
        variances.push(variance);

        totalDegreesOfFreedom += df;
        combinedVarianceNumerator += df * variance;
        logSum += df * Math.log(variance);
    });

    // Variansi gabungan
    const combinedVariance = combinedVarianceNumerator / totalDegreesOfFreedom;

    // Faktor koreksi
    const sumInverseDF = degreesOfFreedom.reduce((sum, df) => sum + 1 / df, 0);
    const correctionFactor =
        1 + (1 / (3 * (k - 1))) * (sumInverseDF - 1 / totalDegreesOfFreedom);

    // Nilai Chi-Square
    const chiSquare =
        (1 / correctionFactor) *
        (totalDegreesOfFreedom * Math.log(combinedVariance) - logSum);

    return { chiSquare, combinedVariance, correctionFactor };
}

// Fungsi untuk menghitung Chi-Square antar populasi
function calculatePairwiseChiSquare(pop1, pop2) {
    return calculateChiSquare([pop1, pop2]);
}

// Fungsi untuk menangani tombol Tambah Populasi
document.getElementById('addPopulationBtn').onclick = function () {
    if (populationCount < MAX_POPULATIONS) {
        populationCount++;
        const formContainer = document.getElementById('formContainer');
        formContainer.appendChild(createPopulationForm(populationCount));
    } else {
        alert('Jumlah populasi maksimum tercapai.');
    }
};

// Fungsi untuk menangani tombol Hitung Data
document.getElementById('submitDataBtn').onclick = function () {
    const allPopulations = [];
    for (let i = 1; i <= populationCount; i++) {
        const rows = document.querySelectorAll(`#tabel-data-${i} tr`);
        const data = Array.from(rows).map(row => {
            const input = row.querySelector('input');
            if (input) {
                return parseFloat(input.value.replace(',', '.'));
            }
            return null;
        }).filter(value => !isNaN(value));

        if (data.length === 0) {
            document.getElementById('overallResult').innerHTML =
                '<p class="error">Error: Semua populasi harus memiliki setidaknya satu data valid.</p>';
            return;
        }

        allPopulations.push(data);
    }

    // Perhitungan Overall Chi-Square
    const { chiSquare, combinedVariance, correctionFactor } =
        calculateChiSquare(allPopulations);

    const criticalValueOverall = 5.99; // df = 2, alpha = 0.05
    const overallResultDiv = document.getElementById('overallResult');
    overallResultDiv.innerHTML = `
        <p><strong>Chi-Square Gabungan:</strong> ${chiSquare.toFixed(4)}</p>
        <p><strong>Variance Gabungan:</strong> ${combinedVariance.toFixed(4)}</p>
        <p><strong>Faktor Koreksi:</strong> ${correctionFactor.toFixed(4)}</p>
        <p><strong>Hasil:</strong> ${
            chiSquare > criticalValueOverall ? 'Signifikan' : 'Tidak Signifikan'
        }</p>
    `;

    // Perhitungan Pairwise Chi-Square
    const pairwiseResultDiv = document.getElementById('pairwiseResult');
    pairwiseResultDiv.innerHTML = '';

    for (let i = 0; i < allPopulations.length; i++) {
        for (let j = i + 1; j < allPopulations.length; j++) {
            const { chiSquare, combinedVariance, correctionFactor } =
                calculatePairwiseChiSquare(allPopulations[i], allPopulations[j]);

            const criticalValuePairwise = 3.841; // df = 1, alpha = 0.05
            pairwiseResultDiv.innerHTML += `
                <p>
                    Populasi ${i + 1} vs Populasi ${j + 1}: 
                    <br>Chi-Square = ${chiSquare.toFixed(4)} 
                    <br>Variance Gabungan = ${combinedVariance.toFixed(4)} 
                    <br>Faktor Koreksi = ${correctionFactor.toFixed(4)}
                    <br>Hasil = ${
                        chiSquare > criticalValuePairwise
                            ? 'Signifikan'
                            : 'Tidak Signifikan'
                    }
                </p>
            `;
        }
    }
};

// Mengambil semua link navigasi
const navLinks = document.querySelectorAll('nav ul li a');

const currentPage = window.location.pathname;

navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
    }
});
