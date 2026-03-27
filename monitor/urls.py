from django.urls import path
from . import views

urlpatterns = [
    path('keywords/', views.KeywordListCreateView.as_view(),
         name='keyword-list-create'),
    path('flags/', views.FlagListView.as_view(), name='flag-list'),
    path('flags/<int:pk>/', views.FlagDetailView.as_view(), name='flag-detail'),
    path('scan/', views.ScanView.as_view(), name='scan'),
    path('fetch/', views.FetchNewsView.as_view(), name='fetch-news'),
]
