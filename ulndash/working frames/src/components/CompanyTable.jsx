import { useEffect, useState } from 'react';


export default function CompanyTable() {
const [companies, setCompanies] = useState([]);
const [filters, setFilters] = useState({});


useEffect(() => {
fetchCompanies();
}, [filters]);


const fetchCompanies = async () => {
let url = `http://localhost/backend/api.php?endpoint=companies`;
if (filters.status) url += `&status=${filters.status}`;
if (filters.has_website) url += `&has_website=${filters.has_website}`;
const res = await fetch(url);
setCompanies(await res.json());
};


return (
<div className="p-4">
<table className="table-auto w-full border">
<thead>
<tr className="bg-gray-100">
<th className="p-2">Company</th>
<th className="p-2">Location</th>
<th className="p-2">Status</th>
<th className="p-2">Actions</th>
</tr>
</thead>
<tbody>
{companies.map(c => (
<tr key={c.id}>
<td className="p-2">{c.name}</td>
<td className="p-2">{c.location}</td>
<td className="p-2">{c.status}</td>
<td className="p-2">
<button className="text-blue-500">Edit</button>
<button className="text-red-500 ml-2">Delete</button>
</td>
</tr>
))}
</tbody>
</table>
</div>
);
}