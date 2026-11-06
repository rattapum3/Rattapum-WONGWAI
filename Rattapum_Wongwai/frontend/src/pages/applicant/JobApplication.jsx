import React from 'react';
import { Link } from 'react-router-dom';
import { STEPS, DEGREE_OPTIONS } from './job-application/jobAppConstants';
import { useJobApplicationForm } from './job-application/useJobApplicationForm';
import JobApplicationStyles from './job-application/JobApplicationStyles';
import StepNavigation from './job-application/StepNavigation';
import PersonalInfoSection from './job-application/PersonalInfoSection';
import AddressContactSection from './job-application/AddressContactSection';
import FamilyInfoSection from './job-application/FamilyInfoSection';
import EducationSection from './job-application/EducationSection';
import WorkHistorySection from './job-application/WorkHistorySection';
import DocumentUploadSection from './job-application/DocumentUploadSection';
import LoadDraftModal from './job-application/LoadDraftModal';
import SubmitConfirmModal from './job-application/SubmitConfirmModal';
import SaveDraftModal from './job-application/SaveDraftModal';
import StepActionFooter from './job-application/StepActionFooter';

export default function JobApplication() {
  const {
    id,
    jobTitle,
    currentStep,
    setCurrentStep,
    maxStepReached,
    validateCitizenAndProceed,
    expanded,
    toggleSection,
    formValues,
    handleFieldChange,
    fieldErrors,
    setFieldErrors,
    getInputClass,
    renderFieldError,
    prefixType,
    setPrefixType,
    customPrefix,
    setCustomPrefix,
    getPrefixVal,
    dob,
    handleDobChange,
    maxDobStr,
    age,
    nationalityType,
    setNationalityType,
    customNationality,
    setCustomNationality,
    religionType,
    setReligionType,
    customReligion,
    setCustomReligion,
    birthProvince,
    setBirthProvince,
    provinces,
    selectedProvince,
    handleProvinceChange,
    selectedAmphoe,
    handleAmphoeChange,
    setSelectedAmphoe,
    selectedTambon,
    handleTambonChange,
    setSelectedTambon,
    addressDataMap,
    zipcode,
    setZipcode,
    mobilePhones,
    phoneErrors,
    handleMobilePhoneChange,
    addMobilePhone,
    removeMobilePhone,
    fatherNationalityType,
    setFatherNationalityType,
    customFatherNationality,
    setCustomFatherNationality,
    fatherReligionType,
    setFatherReligionType,
    customFatherReligion,
    setCustomFatherReligion,
    motherNationalityType,
    setMotherNationalityType,
    customMotherNationality,
    setCustomMotherNationality,
    motherReligionType,
    setMotherReligionType,
    customMotherReligion,
    setCustomMotherReligion,
    spouseNationalityType,
    setSpouseNationalityType,
    customSpouseNationality,
    setCustomSpouseNationality,
    spouseReligionType,
    setSpouseReligionType,
    customSpouseReligion,
    setCustomSpouseReligion,
    educations,
    eduErrors,
    handleEducationDegreeTypeChange,
    handleEducationCustomDegreeChange,
    handleEducationChange,
    addEducation,
    removeEducation,
    maxAllowedDateStr,
    engTests,
    engTestOptions,
    engErrors,
    handleEngTestChange,
    addEngTest,
    removeEngTest,
    obligation,
    setObligation,
    requiredDocs,
    files,
    handleFileUpload,
    removeMainFile,
    extraDocFiles,
    addExtraDocFile,
    removeExtraDocFile,
    handleExtraDocFileChange,
    additionalDocs,
    addAdditionalDoc,
    removeAdditionalDoc,
    handleAdditionalDocChange,
    handleAdditionalDocFile,
    loadModalOpen,
    setLoadModalOpen,
    inputCitizenId,
    setInputCitizenId,
    inputEmail,
    setInputEmail,
    handleLoadDraft,
    isLoadingDraft,
    showConfirmModal,
    setShowConfirmModal,
    isSubmitting,
    handleSaveDraft,
    saveDraftModalOpen,
    saveDraftStatus,
    saveDraftWarningType,
    saveDraftMessage,
    handleExecuteSaveDraft,
    handleCloseSaveDraftModal,
    handleInitiateSubmit,
    handleExecuteSubmit
  } = useJobApplicationForm();

  return (
    <div className="container-fluid py-4">

      {/* ส่วนหัวหน้าจอ */}
      <div className="mb-4 d-flex align-items-start gap-3">
        <Link to={`/jobs/${id}`} className="btn btn-outline-secondary btn-sm rounded-circle px-2 mt-1" style={{ border: 'none', background: '#e0e0e0', color: '#333' }}>
          <i className="bi bi-arrow-left fs-5"></i>
        </Link>
        <div>
          <h2 className="mb-1" style={{ color: '#03A96B', fontWeight: '600' }}>
            กรอกใบสมัครงาน
          </h2>
          <p className="text-dark mb-0 fs-5">ตำแหน่งที่สมัคร: <span className="fw-bold" style={{ color: '#00796b' }}>{jobTitle}</span></p>
        </div>
      </div>

      {/* 📌 แถบเรียกใช้แบบร่าง/ประวัติเดิม */}
      <div className="card border-0 shadow-sm mb-4 bg-light" style={{ borderRadius: '12px', borderLeft: '5px solid #006664' }}>
        <div className="card-body py-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center">
            <i className="bi bi-clock-history fs-3 text-success me-3"></i>
            <div>
              <h6 className="fw-bold mb-1 text-dark">เคยยื่นสมัครหรือบันทึกแบบร่างไว้แล้ว?</h6>
              <p className="small text-muted mb-0">กรอกเลขประจำตัวประชาชนและอีเมลเพื่อเรียกใช้ข้อมูลเดิมให้อัตโนมัติ</p>
            </div>
          </div>
          <button
            type="button"
            className="btn text-white px-4 py-2 fw-bold rounded-pill shadow-sm text-nowrap"
            style={{ backgroundColor: '#006664' }}
            onClick={() => setLoadModalOpen(true)}
          >
            <i className="bi bi-download me-2"></i>เรียกใช้ข้อมูลแบบร่าง
          </button>
        </div>
      </div>

      {/* 📌 Modal สำหรับดึงข้อมูลแบบร่าง / ประวัติเดิม */}
      <LoadDraftModal
        isOpen={loadModalOpen}
        onClose={() => setLoadModalOpen(false)}
        inputCitizenId={inputCitizenId}
        setInputCitizenId={setInputCitizenId}
        inputEmail={inputEmail}
        setInputEmail={setInputEmail}
        handleLoadDraft={handleLoadDraft}
        isLoadingDraft={isLoadingDraft}
      />

      <form onSubmit={(e) => e.preventDefault()}>
        {/* 📍 Stepper Progress Bar (6 Steps) */}
        <StepNavigation
          steps={STEPS}
          currentStep={currentStep}
          maxStepReached={maxStepReached}
          validateCitizenAndProceed={validateCitizenAndProceed}
        />

        {/* Step 1: ข้อมูลส่วนบุคคล */}
        <PersonalInfoSection
          currentStep={currentStep}
          expanded={expanded}
          toggleSection={toggleSection}
          formValues={formValues}
          handleFieldChange={handleFieldChange}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          getInputClass={getInputClass}
          renderFieldError={renderFieldError}
          prefixType={prefixType}
          setPrefixType={setPrefixType}
          customPrefix={customPrefix}
          setCustomPrefix={setCustomPrefix}
          dob={dob}
          handleDobChange={handleDobChange}
          maxDobStr={maxDobStr}
          age={age}
          nationalityType={nationalityType}
          setNationalityType={setNationalityType}
          customNationality={customNationality}
          setCustomNationality={setCustomNationality}
          religionType={religionType}
          setReligionType={setReligionType}
          customReligion={customReligion}
          setCustomReligion={setCustomReligion}
          birthProvince={birthProvince}
          setBirthProvince={setBirthProvince}
          provinces={provinces}
        />

        {/* Step 2: ข้อมูลที่อยู่ และ การติดต่อ */}
        <AddressContactSection
          currentStep={currentStep}
          expanded={expanded}
          toggleSection={toggleSection}
          selectedProvince={selectedProvince}
          handleProvinceChange={handleProvinceChange}
          provinces={provinces}
          selectedAmphoe={selectedAmphoe}
          handleAmphoeChange={handleAmphoeChange}
          setSelectedAmphoe={setSelectedAmphoe}
          selectedTambon={selectedTambon}
          handleTambonChange={handleTambonChange}
          setSelectedTambon={setSelectedTambon}
          addressDataMap={addressDataMap}
          zipcode={zipcode}
          setZipcode={setZipcode}
          formValues={formValues}
          handleFieldChange={handleFieldChange}
          getInputClass={getInputClass}
          renderFieldError={renderFieldError}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          mobilePhones={mobilePhones}
          phoneErrors={phoneErrors}
          handleMobilePhoneChange={handleMobilePhoneChange}
          addMobilePhone={addMobilePhone}
          removeMobilePhone={removeMobilePhone}
        />

        {/* Step 3: ข้อมูลครอบครัว */}
        <FamilyInfoSection
          currentStep={currentStep}
          expanded={expanded}
          toggleSection={toggleSection}
          formValues={formValues}
          handleFieldChange={handleFieldChange}
          getInputClass={getInputClass}
          renderFieldError={renderFieldError}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          fatherNationalityType={fatherNationalityType}
          setFatherNationalityType={setFatherNationalityType}
          customFatherNationality={customFatherNationality}
          setCustomFatherNationality={setCustomFatherNationality}
          fatherReligionType={fatherReligionType}
          setFatherReligionType={setFatherReligionType}
          customFatherReligion={customFatherReligion}
          setCustomFatherReligion={setCustomFatherReligion}
          motherNationalityType={motherNationalityType}
          setMotherNationalityType={setMotherNationalityType}
          customMotherNationality={customMotherNationality}
          setCustomMotherNationality={setCustomMotherNationality}
          motherReligionType={motherReligionType}
          setMotherReligionType={setMotherReligionType}
          customMotherReligion={customMotherReligion}
          setCustomMotherReligion={setCustomMotherReligion}
          spouseNationalityType={spouseNationalityType}
          setSpouseNationalityType={setSpouseNationalityType}
          customSpouseNationality={customSpouseNationality}
          setCustomSpouseNationality={setCustomSpouseNationality}
          spouseReligionType={spouseReligionType}
          setSpouseReligionType={setSpouseReligionType}
          customSpouseReligion={customSpouseReligion}
          setCustomSpouseReligion={setCustomSpouseReligion}
        />

        {/* Step 4: ข้อมูลการศึกษา & ความสามารถ */}
        <EducationSection
          currentStep={currentStep}
          expanded={expanded}
          toggleSection={toggleSection}
          educations={educations}
          eduErrors={eduErrors}
          handleEducationDegreeTypeChange={handleEducationDegreeTypeChange}
          handleEducationCustomDegreeChange={handleEducationCustomDegreeChange}
          handleEducationChange={handleEducationChange}
          addEducation={addEducation}
          removeEducation={removeEducation}
          DEGREE_OPTIONS={DEGREE_OPTIONS}
          maxAllowedDateStr={maxAllowedDateStr}
          engTests={engTests}
          engTestOptions={engTestOptions}
          engErrors={engErrors}
          handleEngTestChange={handleEngTestChange}
          addEngTest={addEngTest}
          removeEngTest={removeEngTest}
          formValues={formValues}
          handleFieldChange={handleFieldChange}
          getInputClass={getInputClass}
          renderFieldError={renderFieldError}
        />

        {/* Step 5: ประวัติการทำงานและภาระผูกพัน */}
        <WorkHistorySection
          currentStep={currentStep}
          expanded={expanded}
          toggleSection={toggleSection}
          formValues={formValues}
          handleFieldChange={handleFieldChange}
          getInputClass={getInputClass}
          renderFieldError={renderFieldError}
          obligation={obligation}
          setObligation={setObligation}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
        />

        {/* Step 6: แนบสำเนาเอกสารประกอบการสมัคร */}
        <DocumentUploadSection
          currentStep={currentStep}
          requiredDocs={requiredDocs}
          files={files}
          handleFileUpload={handleFileUpload}
          removeMainFile={removeMainFile}
          extraDocFiles={extraDocFiles}
          addExtraDocFile={addExtraDocFile}
          removeExtraDocFile={removeExtraDocFile}
          handleExtraDocFileChange={handleExtraDocFileChange}
          additionalDocs={additionalDocs}
          addAdditionalDoc={addAdditionalDoc}
          removeAdditionalDoc={removeAdditionalDoc}
          handleAdditionalDocChange={handleAdditionalDocChange}
          handleAdditionalDocFile={handleAdditionalDocFile}
        />

        {/* 📍 ปุ่มควบคุมแบบ Multi-Step 6 ขั้นตอน */}
        <StepActionFooter
          id={id}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          handleSaveDraft={handleSaveDraft}
          validateCitizenAndProceed={validateCitizenAndProceed}
          handleInitiateSubmit={handleInitiateSubmit}
          isSubmitting={isSubmitting}
        />

        {/* 📌 Modal ยืนยันความแน่ใจก่อนส่งใบสมัคร (Confirmation Modal) */}
        <SubmitConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          isSubmitting={isSubmitting}
          jobTitle={jobTitle}
          prefixVal={getPrefixVal()}
          firstName={formValues.firstName || document.getElementById('firstName')?.value || ""}
          lastName={formValues.lastName || document.getElementById('lastName')?.value || ""}
          citizenId={formValues.citizenId || document.getElementById('citizenId')?.value || ""}
          email={formValues.email || document.getElementById('email')?.value || ""}
          mobilePhone={mobilePhones[0] || "-"}
          uploadedFilesCount={Object.keys(files).length}
          handleExecuteSubmit={handleExecuteSubmit}
        />

        {/* 📌 Modal สำหรับบันทึกแบบร่าง (Save Draft Modal) */}
        <SaveDraftModal
          isOpen={saveDraftModalOpen}
          onClose={handleCloseSaveDraftModal}
          onConfirm={handleExecuteSaveDraft}
          saveStatus={saveDraftStatus}
          statusMessage={saveDraftMessage}
          warningType={saveDraftWarningType}
          jobTitle={jobTitle}
          prefixVal={getPrefixVal()}
          firstName={formValues.firstName || document.getElementById('firstName')?.value || ""}
          lastName={formValues.lastName || document.getElementById('lastName')?.value || ""}
          citizenId={formValues.citizenId || document.getElementById('citizenId')?.value || ""}
          email={formValues.email || document.getElementById('email')?.value || ""}
          onGoToStep1={() => {
            handleCloseSaveDraftModal();
            setCurrentStep(1);
            setTimeout(() => {
              const el = document.getElementById('citizenId') || document.getElementById('email');
              if (el) el.focus();
            }, 100);
          }}
        />
      </form>

      {/* Global CSS Styles & Datalists */}
      <JobApplicationStyles />
    </div>
  );
}