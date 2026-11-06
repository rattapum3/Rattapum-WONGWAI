import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// คอมโพเนนต์ช่วยแสดง Label และ Value (วางไว้นอก Component หลักเพื่อประสิทธิภาพที่ดี)
const DataRow = ({ label, value, color = "text-dark" }) => (
  <div className="mb-3">
    <div className="text-muted small mb-1">{label}</div>
    <div className={`fw-medium ${color}`}>{value || "-"}</div>
  </div>
);

export default function ApplicantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');

  const [applicantData, setApplicantData] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // id ที่ถูกส่งมาคือ rawId ของ Application เช่น 1, 2, 3
      const response = await fetch(`http://localhost:3000/api/applications/${id}`);
      const data = await response.json();
      if (data.success) {
        setApplicantData(data.data);
      }
    } catch (error) {
      console.error('Error fetching applicant details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-5">กำลังโหลดข้อมูล...</div>;
  }

  if (!applicantData) {
    return <div className="text-center py-5 text-danger">ไม่พบข้อมูลผู้สมัคร</div>;
  }

  return (
    <div className="container-fluid py-4">

      {/* ส่วนหัวหน้าจอ */}
      <div className="mb-4 d-flex align-items-start gap-3">
        <button onClick={() => navigate(-1)} className="btn btn-outline-secondary btn-sm rounded-circle px-2 mt-1" style={{ border: 'none', background: '#e0e0e0', color: '#333' }}>
          <i className="bi bi-arrow-left fs-5"></i>
        </button>
        <div>
          <h2 className="mb-1" style={{ color: '#03A96B', fontWeight: '600' }}>
            <i className="bi bi-file-earmark-person-fill me-2"></i>ข้อมูลและเอกสารใบสมัคร
          </h2>
          <p className="text-muted fs-6 mb-0">
            ตำแหน่ง: <span className="fw-bold text-primary">{applicantData.jobTitle}</span>
          </p>
        </div>
      </div>

      <div className="row g-4">

        {/* ========================================== */}
        {/* คอลัมน์ซ้าย: สรุปโปรไฟล์ผู้สมัครแบบย่อ */}
        {/* ========================================== */}
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm sticky-top" style={{ borderTop: '4px solid #03A96B', top: '20px' }}>
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center border" style={{ width: '100px', height: '100px' }}>
                  <i className="bi bi-person-fill text-secondary" style={{ fontSize: '3.5rem' }}></i>
                </div>
              </div>
              <h5 className="fw-bold text-dark mb-1">
                {applicantData.personal.title}{applicantData.personal.firstName} {applicantData.personal.lastName}
              </h5>
              <p className="text-muted small mb-3">{applicantData.educations?.[0]?.degree || '-'} <br /> {applicantData.educations?.[0]?.major || ''}</p>

              <div className="badge bg-warning text-dark px-3 py-2 rounded-pill mb-4 w-100">
                สถานะ: {applicantData.status}
              </div>

              <div className="text-start border-top pt-3 small">
                <div className="mb-2"><i className="bi bi-telephone-fill text-success me-2"></i> {applicantData.contact?.mobilePhones?.[0] || '-'}</div>
                <div className="mb-2"><i className="bi bi-envelope-fill text-danger me-2"></i> {applicantData.email}</div>
                <div className="mb-2"><i className="bi bi-calendar-check-fill text-primary me-2"></i> สมัครเมื่อ: {applicantData.appliedDate}</div>
              </div>

              <div className="d-flex flex-column gap-2 mt-3">

                <a
                  href={`http://localhost:3000/api/export/application/${id}/pdf`}
                  download
                  className="btn btn-outline-danger w-100 btn-sm fw-bold d-flex align-items-center justify-content-center shadow-sm"
                  title="ดาวน์โหลดไฟล์ใบสมัคร PDF ทันที"
                >
                  <i className="bi bi-file-earmark-pdf-fill me-2 fs-6"></i>ดาวน์โหลดใบสมัคร (PDF)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* คอลัมน์ขวา: Tabs ข้อมูลแบบละเอียด และ เอกสาร */}
        {/* ========================================== */}
        <div className="col-lg-9">

          <ul className="nav nav-pills mb-4 bg-white p-2 rounded shadow-sm border">
            <li className="nav-item flex-fill text-center">
              <button
                className={`nav-link w-100 fw-bold ${activeTab === 'info' ? 'active' : 'text-secondary'}`}
                style={activeTab === 'info' ? { backgroundColor: '#03A96B' } : {}}
                onClick={() => setActiveTab('info')}
              >
                <i className="bi bi-card-text me-2"></i>ข้อมูลใบสมัครฉบับเต็ม
              </button>
            </li>
            <li className="nav-item flex-fill text-center">
              <button
                className={`nav-link w-100 fw-bold ${activeTab === 'documents' ? 'active' : 'text-secondary'}`}
                style={activeTab === 'documents' ? { backgroundColor: '#03A96B' } : {}}
                onClick={() => setActiveTab('documents')}
              >
                <i className="bi bi-folder-fill me-2"></i>เอกสารแนบ ({applicantData.documents.length})
              </button>
            </li>
          </ul>

          {/* ======================= TAB: ข้อมูลใบสมัคร ======================= */}
          {activeTab === 'info' && (
            <div className="card border-0 shadow-sm mb-5">
              <div className="card-body p-4 p-md-5">

                {/* ส่วนที่ 0: ข้อมูลการลงทะเบียนเบื้องต้น */}
                <div className="bg-light p-3 rounded mb-4 border">
                  <div className="row g-3">
                    <div className="col-md-6"><DataRow label="เลขประจำตัวประชาชน" value={applicantData.idCard} color="text-primary" /></div>
                    <div className="col-md-6"><DataRow label="อีเมล (E-mail)" value={applicantData.email} color="text-primary" /></div>
                  </div>
                </div>

                {/* 1. ข้อมูลส่วนบุคคล */}
                <h5 className="fw-bold text-dark border-bottom pb-2 mb-4"><i className="bi bi-person-vcard text-success me-2"></i>1. ข้อมูลส่วนบุคคล</h5>
                <div className="row g-3">
                  <div className="col-md-2"><DataRow label="คำนำหน้าชื่อ" value={applicantData.personal.title} /></div>
                  <div className="col-md-5"><DataRow label="ชื่อ" value={applicantData.personal.firstName} /></div>
                  <div className="col-md-5"><DataRow label="นามสกุล" value={applicantData.personal.lastName} /></div>

                  <div className="col-md-4"><DataRow label="วัน/เดือน/ปีเกิด" value={applicantData.personal.dob} /></div>
                  <div className="col-md-2"><DataRow label="อายุ (ปี)" value={applicantData.personal.ageYears} /></div>
                  <div className="col-md-2"><DataRow label="อายุ (เดือน)" value={applicantData.personal.ageMonths} /></div>

                  <div className="col-md-4"><DataRow label="สัญชาติ" value={applicantData.personal.nationality} /></div>
                  <div className="col-md-4"><DataRow label="ศาสนา" value={applicantData.personal.religion} /></div>
                  <div className="col-md-4"><DataRow label="จังหวัดที่เกิด" value={applicantData.personal.birthplace} /></div>
                </div>

                {/* 2. ข้อมูลที่อยู่และการติดต่อ */}
                <h5 className="fw-bold text-dark border-bottom pb-2 mb-4 mt-4"><i className="bi bi-house-door text-success me-2"></i>2. ข้อมูลที่อยู่ปัจจุบันและการติดต่อ</h5>
                <h6 className="fw-bold text-secondary mb-3">ที่อยู่ตามปัจจุบัน</h6>
                <div className="row g-3 bg-light p-3 rounded mb-4">
                  <div className="col-md-3"><DataRow label="จังหวัด" value={applicantData.address.province} /></div>
                  <div className="col-md-3"><DataRow label="อำเภอ / เขต" value={applicantData.address.amphoe} /></div>
                  <div className="col-md-3"><DataRow label="ตำบล / แขวง" value={applicantData.address.tambon} /></div>
                  <div className="col-md-3"><DataRow label="รหัสไปรษณีย์" value={applicantData.address.zipcode} /></div>

                  <div className="col-md-3"><DataRow label="บ้านเลขที่" value={applicantData.address.houseNo} /></div>
                  <div className="col-md-2"><DataRow label="หมู่ที่" value={applicantData.address.moo} /></div>
                  <div className="col-md-3"><DataRow label="ตรอก/ซอย" value={applicantData.address.soi} /></div>
                  <div className="col-md-4"><DataRow label="ถนน" value={applicantData.address.road} /></div>
                </div>

                <h6 className="fw-bold text-secondary mb-3">ช่องทางการติดต่อ (โทรศัพท์มือถือ)</h6>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="text-muted small mb-1">โทรศัพท์มือถือ</div>
                    {applicantData.contact.mobilePhones.map((phone, i) => <div key={i} className="fw-medium mb-1"><i className="bi bi-telephone text-muted me-2"></i>{phone}</div>)}
                  </div>
                </div>

                {/* 3. ข้อมูลครอบครัว */}
                <h5 className="fw-bold text-dark border-bottom pb-2 mb-4 mt-4"><i className="bi bi-people text-success me-2"></i>3. ข้อมูลครอบครัว</h5>
                <h6 className="fw-bold text-secondary mb-3">ข้อมูลบิดา</h6>
                <div className="row g-3 bg-light p-3 rounded mb-3">
                  <div className="col-md-3"><DataRow label="ชื่อบิดา" value={applicantData.family.father.name} /></div>
                  <div className="col-md-3"><DataRow label="สัญชาติ" value={applicantData.family.father.nationality} /></div>
                  <div className="col-md-3"><DataRow label="ศาสนา" value={applicantData.family.father.religion} /></div>
                  <div className="col-md-3"><DataRow label="อาชีพ" value={applicantData.family.father.occupation} /></div>
                </div>
                <h6 className="fw-bold text-secondary mb-3">ข้อมูลมารดา</h6>
                <div className="row g-3 bg-light p-3 rounded mb-3">
                  <div className="col-md-3"><DataRow label="ชื่อมารดา" value={applicantData.family.mother.name} /></div>
                  <div className="col-md-3"><DataRow label="สัญชาติ" value={applicantData.family.mother.nationality} /></div>
                  <div className="col-md-3"><DataRow label="ศาสนา" value={applicantData.family.mother.religion} /></div>
                  <div className="col-md-3"><DataRow label="อาชีพ" value={applicantData.family.mother.occupation} /></div>
                </div>
                <h6 className="fw-bold text-secondary mb-3">ข้อมูลคู่สมรส (ถ้ามี)</h6>
                <div className="row g-3 bg-light p-3 rounded">
                  <div className="col-md-3"><DataRow label="ชื่อคู่สมรส" value={applicantData.family.spouse.name} /></div>
                  <div className="col-md-3"><DataRow label="สัญชาติ" value={applicantData.family.spouse.nationality} /></div>
                  <div className="col-md-3"><DataRow label="ศาสนา" value={applicantData.family.spouse.religion} /></div>
                  <div className="col-md-3"><DataRow label="อาชีพ" value={applicantData.family.spouse.occupation} /></div>
                </div>

                {/* 4. ประวัติการศึกษาและความสามารถ */}
                <h5 className="fw-bold text-dark border-bottom pb-2 mb-4 mt-5"><i className="bi bi-mortarboard text-success me-2"></i>4. ประวัติการศึกษาและความสามารถ</h5>
                <h6 className="fw-bold text-secondary mb-3">ข้อมูลการศึกษา</h6>
                {applicantData.educations.map((edu, index) => (
                  <div key={index} className="bg-light p-4 rounded border mb-3 position-relative">
                    <div className="fw-bold text-primary mb-3"><i className="bi bi-award-fill me-2"></i>วุฒิการศึกษาที่ {index + 1}</div>
                    <div className="row g-3">
                      <div className="col-md-6"><DataRow label="ระดับวุฒิการศึกษา" value={edu.degree} /></div>
                      <div className="col-md-4"><DataRow label="สาขาวิชาเอก" value={edu.major} /></div>
                      <div className="col-md-2"><DataRow label="เกรดเฉลี่ย (GPA)" value={edu.gpa} color="text-danger" /></div>

                      <div className="col-md-6"><DataRow label="ชื่อสถานศึกษา" value={edu.university} /></div>
                      <div className="col-md-6"><DataRow label="ประเทศ" value={edu.country} /></div>

                      <div className="col-md-6"><DataRow label="วันที่ได้รับอนุมัติผล" value={edu.approvalDate} /></div>
                    </div>
                  </div>
                ))}

                <h6 className="fw-bold mt-4 mb-3 text-secondary">ผลการทดสอบภาษาอังกฤษ</h6>
                <div className="row g-3 mb-4">
                  {applicantData.abilities.englishTests.map((test, index) => (
                    <div className="col-md-6 col-lg-4" key={index}>
                      <div className="border p-2 rounded d-flex justify-content-between align-items-center bg-light">
                        <div>
                          <div className="fw-semibold text-dark small">{test.name}</div>
                          {test.examDate && test.examDate !== '-' && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                              <i className="bi bi-calendar-event me-1 text-primary"></i>วันที่สอบ: {test.examDate}
                            </div>
                          )}
                        </div>
                        <span className="fw-bold text-primary fs-6">{test.score}</span>
                      </div>
                    </div>
                  ))}
                  {applicantData.abilities.englishTests.length === 0 && <div className="text-muted small">- ไม่มีข้อมูล -</div>}
                </div>

                <h6 className="fw-bold mt-4 mb-3 text-secondary">ความสามารถพิเศษและภาษาอื่นๆ</h6>
                <div className="row g-3">
                  <div className="col-md-6"><DataRow label="ความรู้ความสามารถพิเศษ" value={applicantData.abilities.specialSkills} /></div>
                  <div className="col-md-6"><DataRow label="ความรู้ภาษาต่างประเทศ" value={applicantData.abilities.languages} /></div>
                </div>

                {/* 5. ประวัติการทำงานและภาระผูกพัน */}
                <h5 className="fw-bold text-dark border-bottom pb-2 mb-4 mt-5"><i className="bi bi-briefcase text-success me-2"></i>5. ข้อมูลการทำงานและภาระผูกพัน</h5>
                <h6 className="fw-bold text-secondary mb-3">สถานะการทำงานปัจจุบัน</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4"><DataRow label="ขณะนี้มีอาชีพอะไร" value={applicantData.workAndObligations.currentJob} /></div>
                  <div className="col-md-4"><DataRow label="ทำงาน ณ ที่ใด" value={applicantData.workAndObligations.workplace} /></div>
                  <div className="col-md-4"><DataRow label="กรณีเป็นบุคลากร มก. เป็นประเภทใด" value={applicantData.workAndObligations.kuStaffStatus} /></div>
                  <div className="col-12"><DataRow label="เคยทำงานอะไรมาบ้าง" value={applicantData.workAndObligations.workExperience} /></div>
                </div>

                <h6 className="fw-bold text-secondary mb-3">ภาระผูกพันการชดใช้ทุน / ลาศึกษาต่อ</h6>
                <div className="row g-3 mb-3">
                  <div className="col-md-4"><DataRow label="ภาระผูกพันตามสัญญารับทุน" value={applicantData.workAndObligations.scholarshipObligation} /></div>
                  <div className="col-md-4"><DataRow label="หน่วยงานที่ชดใช้ทุน" value={applicantData.workAndObligations.scholarshipAgency} /></div>
                  <div className="col-md-4"><DataRow label="ชื่อสัญญารับทุน" value={applicantData.workAndObligations.scholarshipName} /></div>
                </div>
                <div className="row g-3 bg-light p-3 rounded">
                  <div className="col-md-6"><DataRow label="ภาระผูกพันชดใช้สัญญา (พนักงานมหาวิทยาลัย สังกัด)" value={applicantData.workAndObligations.kuObligationUniv} /></div>
                  <div className="col-md-6"><DataRow label="ภาระผูกพันชดใช้สัญญา (พนักงานเงินรายได้ สังกัด)" value={applicantData.workAndObligations.kuObligationIncome} /></div>
                </div>

              </div>
            </div>
          )}

          {/* ======================= TAB: เอกสารแนบ ======================= */}
          {activeTab === 'documents' && (
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold text-dark"><i className="bi bi-files me-2"></i>รายการเอกสารที่ผู้สมัครอัปโหลด</h5>
                <span className="badge bg-secondary rounded-pill">
                  {applicantData.documents ? applicantData.documents.length : 0} รายการ
                </span>
              </div>
              <div className="card-body p-0">
                {(!applicantData.documents || applicantData.documents.length === 0) ? (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-folder-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                    <div>ผู้สมัครไม่ได้แนบไฟล์เอกสารในระบบ</div>
                  </div>
                ) : (
                  <ul className="list-group list-group-flush">
                    {applicantData.documents.map((doc, index) => {
                      const isPdf = doc.type === 'pdf';
                      const isImage = doc.type === 'image';
                      const isWord = doc.type === 'word';
                      const iconClass = isPdf ? 'bi-filetype-pdf' : (isImage ? 'bi-file-earmark-image' : (isWord ? 'bi-filetype-docx' : 'bi-file-earmark-text'));
                      const badgeBg = isPdf ? 'bg-danger-subtle text-danger' : (isImage ? 'bg-primary-subtle text-primary' : (isWord ? 'bg-info-subtle text-info' : 'bg-secondary-subtle text-secondary'));

                      return (
                        <li className="list-group-item d-flex justify-content-between align-items-center p-3 hover-bg-light" key={index}>
                          <div className="d-flex align-items-center">
                            <div className={`rounded p-2 me-3 text-center d-flex align-items-center justify-content-center ${badgeBg}`} style={{ width: '45px', height: '45px' }}>
                              <i className={`bi fs-4 ${iconClass}`}></i>
                            </div>
                            <div>
                              <div className="text-muted small mb-1">{doc.group}</div>
                              <h6 className="mb-1 fw-bold text-dark">{doc.name}</h6>
                              {doc.fileName && doc.fileName !== doc.name && (
                                <div className="text-muted small">
                                  <span className="text-truncate d-inline-block" style={{ maxWidth: '300px' }}>
                                    <i className="bi bi-paperclip me-1"></i>{doc.fileName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            {doc.url ? (
                              <>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary px-3 d-inline-flex align-items-center shadow-sm"
                                  style={{ borderRadius: '6px' }}
                                >
                                  <i className="bi bi-eye-fill me-1"></i> เปิดดู
                                </a>
                                <a
                                  href={doc.url}
                                  download={doc.fileName || true}
                                  className="btn btn-sm btn-light border px-2 d-inline-flex align-items-center shadow-sm"
                                  title="ดาวน์โหลดไฟล์"
                                  style={{ borderRadius: '6px' }}
                                >
                                  <i className="bi bi-download text-secondary"></i>
                                </a>
                              </>
                            ) : (
                              <button className="btn btn-sm btn-outline-secondary px-3" disabled>
                                <i className="bi bi-x-circle me-1"></i> ไม่มีไฟล์
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}