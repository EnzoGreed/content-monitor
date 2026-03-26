from rest_framework import serializers
from .models import Keyword, ContentItem, Flag


class KeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Keyword
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class ContentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentItem
        fields = ['id', 'title', 'body', 'source',
                  'last_updated', 'created_at']
        read_only_fields = ['id', 'created_at']


class FlagSerializer(serializers.ModelSerializer):
    keyword_name = serializers.CharField(source='keyword.name', read_only=True)
    content_title = serializers.CharField(
        source='content_item.title', read_only=True)

    class Meta:
        model = Flag
        fields = [
            'id',
            'keyword',
            'keyword_name',
            'content_item',
            'content_title',
            'score',
            'status',
            'reviewed_at',
            'created_at'
        ]
        read_only_fields = ['id', 'score',
                            'keyword_name', 'content_title', 'created_at']
