{{/*
Expand the name of the chart.
*/}}
{{- define "speedtest.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "speedtest.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "speedtest.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "speedtest.labels" -}}
helm.sh/chart: {{ include "speedtest.chart" . }}
{{ include "speedtest.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/name: {{ include "speedtest.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "speedtest.selectorLabels" -}}
app.kubernetes.io/name: {{ include "speedtest.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app: {{ .Values.labels.app }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "speedtest.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "speedtest.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create the name of the image pull secret to use
*/}}
{{- define "speedtest.imagePullSecretName" -}}
{{- if .Values.imagePullSecrets.existingSecret }}
{{- .Values.imagePullSecrets.existingSecret }}
{{- else }}
{{- .Values.imagePullSecrets.name }}
{{- end }}
{{- end }}

{{/*
Determine if image pull secrets should be used
*/}}
{{- define "speedtest.useImagePullSecrets" -}}
{{- if .Values.imagePullSecrets.existingSecret }}
{{- true }}
{{- else if and .Values.imagePullSecrets.create .Values.imagePullSecrets.registry.username .Values.imagePullSecrets.registry.password }}
{{- true }}
{{- else }}
{{- false }}
{{- end }}
{{- end }}
