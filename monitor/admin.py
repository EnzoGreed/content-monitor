from django.contrib import admin
from .models import Keyword, ContentItem, Flag


@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(ContentItem)
class ContentItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'source', 'last_updated', 'created_at']
    search_fields = ['title', 'body']
    list_filter = ['source']


@admin.register(Flag)
class FlagAdmin(admin.ModelAdmin):
    list_display = ['keyword', 'content_item',
                    'score', 'status', 'reviewed_at']
    list_filter = ['status']
    search_fields = ['keyword__name', 'content_item__title']
